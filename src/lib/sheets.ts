import { google } from 'googleapis'
import { createServiceClient } from './supabase-server'

const SHEET_COLUMNS = {
  row_id: 0,
  first_name: 1,
  last_name: 2,
  phone: 3,
  email: 4,
  state: 5,
  policy_type: 6,
  premium: 7,
  source: 8,
  temp: 9,
  stage: 10,
  commission: 11,
}

async function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}')
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

export async function pullFromSheets(): Promise<{ rowsPulled: number; rowsPushed: number; error?: string }> {
  const supabase = createServiceClient()
  const sheetId = process.env.GOOGLE_SHEETS_ID
  if (!sheetId) return { rowsPulled: 0, rowsPushed: 0, error: 'GOOGLE_SHEETS_ID not set' }

  try {
    const sheets = await getSheetsClient()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1!A2:L',
    })

    const rows = res.data.values || []
    let rowsPulled = 0

    for (const row of rows) {
      const phone = row[SHEET_COLUMNS.phone]?.toString().trim()
      const firstName = row[SHEET_COLUMNS.first_name]?.toString().trim()
      const lastName = row[SHEET_COLUMNS.last_name]?.toString().trim()
      if (!firstName || !lastName) continue

      // Upsert contact by phone
      let contactId: string | null = null
      if (phone) {
        const { data: existing } = await supabase
          .from('contacts')
          .select('id')
          .eq('phone', phone)
          .single()

        if (existing) {
          contactId = existing.id
        } else {
          const { data: newContact } = await supabase
            .from('contacts')
            .insert({
              first_name: firstName,
              last_name: lastName,
              phone,
              email: row[SHEET_COLUMNS.email]?.toString().trim() || null,
              state: row[SHEET_COLUMNS.state]?.toString().trim() || null,
              source: row[SHEET_COLUMNS.source]?.toString().trim() || null,
              mode: 'bot',
            })
            .select('id')
            .single()
          contactId = newContact?.id || null
        }
      } else {
        const { data: newContact } = await supabase
          .from('contacts')
          .insert({
            first_name: firstName,
            last_name: lastName,
            phone: null,
            email: row[SHEET_COLUMNS.email]?.toString().trim() || null,
            state: row[SHEET_COLUMNS.state]?.toString().trim() || null,
            source: row[SHEET_COLUMNS.source]?.toString().trim() || null,
            mode: 'bot',
          })
          .select('id')
          .single()
        contactId = newContact?.id || null
      }

      if (!contactId) continue

      // Check if insurance lead exists for this contact
      const { data: existingLead } = await supabase
        .from('insurance_leads')
        .select('id')
        .eq('contact_id', contactId)
        .single()

      if (!existingLead) {
        await supabase.from('insurance_leads').insert({
          contact_id: contactId,
          stage: 'new_lead',
          policy_type: row[SHEET_COLUMNS.policy_type]?.toString().toLowerCase().trim() || null,
          annual_premium: parseFloat(row[SHEET_COLUMNS.premium] || '0') || null,
          temp: (row[SHEET_COLUMNS.temp]?.toString().toLowerCase().trim() as 'hot' | 'warm' | 'cold') || 'warm',
        })
        rowsPulled++
      }
    }

    // Log sync
    await supabase.from('sheets_sync_log').insert({
      sheet_id: sheetId,
      rows_pulled: rowsPulled,
      rows_pushed: 0,
      status: 'success',
    })

    return { rowsPulled, rowsPushed: 0 }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    await supabase.from('sheets_sync_log').insert({
      sheet_id: sheetId,
      rows_pulled: 0,
      rows_pushed: 0,
      status: 'error',
      error: errorMsg,
    })
    return { rowsPulled: 0, rowsPushed: 0, error: errorMsg }
  }
}

export async function pushToSheets(leadId: string, stage: string, commission: number | null) {
  const sheetId = process.env.GOOGLE_SHEETS_ID
  if (!sheetId) return

  try {
    const supabase = createServiceClient()
    const { data: lead } = await supabase
      .from('insurance_leads')
      .select('*, contact:contacts(*)')
      .eq('id', leadId)
      .single()

    if (!lead) return

    const sheets = await getSheetsClient()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:D',
    })

    const rows = res.data.values || []
    const phone = lead.contact?.phone
    if (!phone) return

    const rowIndex = rows.findIndex(r => r[SHEET_COLUMNS.phone]?.toString().trim() === phone)
    if (rowIndex === -1) return

    const sheetRow = rowIndex + 2 // +1 for header, +1 for 1-indexed
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Sheet1!K${sheetRow}:L${sheetRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[stage, commission?.toString() || '']],
      },
    })
  } catch {
    // Silently fail push - don't break CRM operations
  }
}
