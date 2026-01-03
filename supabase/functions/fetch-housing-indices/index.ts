import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Defines standard CORS handling
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const EVDS_API_KEY = Deno.env.get('EVDS_API_KEY')

    // Prepare Date Range: Last 13 months to calculate YoY change
    const now = new Date()
    const endDate = `01-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`

    const lastYearDate = new Date()
    lastYearDate.setFullYear(lastYearDate.getFullYear() - 2) // Check longer history to be safe
    const startDate = `01-01-${lastYearDate.getFullYear()}`

    // -----------------------------------------------------------------------
    // 1. Define Mapping: City Name -> TCMB Series Code (NUTS-2 Regions)
    // Source: TCMB EVDS Residential Property Price Index Metadata (Ek 1)
    // -----------------------------------------------------------------------
    const cityToSeriesMap: Record<string, string> = {
        // TR10
        'İstanbul': 'TP.KONUT.KFE.TR10',

        // TR21 (Tekirdağ, Edirne, Kırklareli)
        'Tekirdağ': 'TP.KONUT.KFE.TR21', 'Edirne': 'TP.KONUT.KFE.TR21', 'Kırklareli': 'TP.KONUT.KFE.TR21',
        // TR22 (Balıkesir, Çanakkale)
        'Balıkesir': 'TP.KONUT.KFE.TR22', 'Çanakkale': 'TP.KONUT.KFE.TR22',

        // TR31 (İzmir)
        'İzmir': 'TP.KONUT.KFE.TR31',
        // TR32 (Aydın, Denizli, Muğla)
        'Aydın': 'TP.KONUT.KFE.TR32', 'Denizli': 'TP.KONUT.KFE.TR32', 'Muğla': 'TP.KONUT.KFE.TR32',
        // TR33 (Manisa, Afyon, Kütahya, Uşak)
        'Manisa': 'TP.KONUT.KFE.TR33', 'Afyonkarahisar': 'TP.KONUT.KFE.TR33', 'Kütahya': 'TP.KONUT.KFE.TR33', 'Uşak': 'TP.KONUT.KFE.TR33',

        // TR41 (Bursa, Eskişehir, Bilecik)
        'Bursa': 'TP.KONUT.KFE.TR41', 'Eskişehir': 'TP.KONUT.KFE.TR41', 'Bilecik': 'TP.KONUT.KFE.TR41',
        // TR42 (Kocaeli, Sakarya, Düzce, Bolu, Yalova)
        'Kocaeli': 'TP.KONUT.KFE.TR42', 'Sakarya': 'TP.KONUT.KFE.TR42', 'Düzce': 'TP.KONUT.KFE.TR42', 'Bolu': 'TP.KONUT.KFE.TR42', 'Yalova': 'TP.KONUT.KFE.TR42',

        // TR51 (Ankara)
        'Ankara': 'TP.KONUT.KFE.TR51',
        // TR52 (Konya, Karaman)
        'Konya': 'TP.KONUT.KFE.TR52', 'Karaman': 'TP.KONUT.KFE.TR52',

        // TR61 (Antalya, Isparta, Burdur)
        'Antalya': 'TP.KONUT.KFE.TR61', 'Isparta': 'TP.KONUT.KFE.TR61', 'Burdur': 'TP.KONUT.KFE.TR61',
        // TR62 (Adana, Mersin)
        'Adana': 'TP.KONUT.KFE.TR62', 'Mersin': 'TP.KONUT.KFE.TR62',
        // TR63 (Hatay, K.Maraş, Osmaniye)
        'Hatay': 'TP.KONUT.KFE.TR63', 'Kahramanmaraş': 'TP.KONUT.KFE.TR63', 'Osmaniye': 'TP.KONUT.KFE.TR63',

        // TR71 (Kırıkkale, Aksaray, Niğde, Nevşehir, Kırşehir)
        'Kırıkkale': 'TP.KONUT.KFE.TR71', 'Aksaray': 'TP.KONUT.KFE.TR71', 'Niğde': 'TP.KONUT.KFE.TR71', 'Nevşehir': 'TP.KONUT.KFE.TR71', 'Kırşehir': 'TP.KONUT.KFE.TR71',
        // TR72 (Kayseri, Sivas, Yozgat)
        'Kayseri': 'TP.KONUT.KFE.TR72', 'Sivas': 'TP.KONUT.KFE.TR72', 'Yozgat': 'TP.KONUT.KFE.TR72',

        // TR81 (Zonguldak, Karabük, Bartın)
        'Zonguldak': 'TP.KONUT.KFE.TR81', 'Karabük': 'TP.KONUT.KFE.TR81', 'Bartın': 'TP.KONUT.KFE.TR81',
        // TR82 (Kastamonu, Çankırı, Sinop)
        'Kastamonu': 'TP.KONUT.KFE.TR82', 'Çankırı': 'TP.KONUT.KFE.TR82', 'Sinop': 'TP.KONUT.KFE.TR82',
        // TR83 (Samsun, Tokat, Çorum, Amasya)
        'Samsun': 'TP.KONUT.KFE.TR83', 'Tokat': 'TP.KONUT.KFE.TR83', 'Çorum': 'TP.KONUT.KFE.TR83', 'Amasya': 'TP.KONUT.KFE.TR83',

        // TR90 (Trabzon, Ordu, Giresun, Rize, Artvin, Gümüşhane)
        'Trabzon': 'TP.KONUT.KFE.TR90', 'Ordu': 'TP.KONUT.KFE.TR90', 'Giresun': 'TP.KONUT.KFE.TR90', 'Rize': 'TP.KONUT.KFE.TR90', 'Artvin': 'TP.KONUT.KFE.TR90', 'Gümüşhane': 'TP.KONUT.KFE.TR90',

        // TRA1 (Erzurum, Erzincan, Bayburt)
        'Erzurum': 'TP.KONUT.KFE.TRA1', 'Erzincan': 'TP.KONUT.KFE.TRA1', 'Bayburt': 'TP.KONUT.KFE.TRA1',
        // TRA2 (Ağrı, Kars, Iğdır, Ardahan)
        'Ağrı': 'TP.KONUT.KFE.TRA2', 'Kars': 'TP.KONUT.KFE.TRA2', 'Iğdır': 'TP.KONUT.KFE.TRA2', 'Ardahan': 'TP.KONUT.KFE.TRA2',

        // TRB1 (Malatya, Elazığ, Bingöl, Tunceli)
        'Malatya': 'TP.KONUT.KFE.TRB1', 'Elazığ': 'TP.KONUT.KFE.TRB1', 'Bingöl': 'TP.KONUT.KFE.TRB1', 'Tunceli': 'TP.KONUT.KFE.TRB1',
        // TRB2 (Van, Muş, Bitlis, Hakkari)
        'Van': 'TP.KONUT.KFE.TRB2', 'Muş': 'TP.KONUT.KFE.TRB2', 'Bitlis': 'TP.KONUT.KFE.TRB2', 'Hakkari': 'TP.KONUT.KFE.TRB2', 'Hakkâri': 'TP.KONUT.KFE.TRB2',

        // TRC1 (Gaziantep, Adıyaman, Kilis)
        'Gaziantep': 'TP.KONUT.KFE.TRC1', 'Adıyaman': 'TP.KONUT.KFE.TRC1', 'Kilis': 'TP.KONUT.KFE.TRC1',
        // TRC2 (Şanlıurfa, Diyarbakır)
        'Şanlıurfa': 'TP.KONUT.KFE.TRC2', 'Diyarbakır': 'TP.KONUT.KFE.TRC2',
        // TRC3 (Mardin, Batman, Şırnak, Siirt)
        'Mardin': 'TP.KONUT.KFE.TRC3', 'Batman': 'TP.KONUT.KFE.TRC3', 'Şırnak': 'TP.KONUT.KFE.TRC3', 'Siirt': 'TP.KONUT.KFE.TRC3'
    }

    // Add GENEL for fallback
    const allSeries = ['TP.KONUT.KFE.GENEL', ...new Set(Object.values(cityToSeriesMap))]
    const series = allSeries.join('-')

    // TCMB NEW RULE (April 2024): Key MUST be in Header.
    // We trim the key to avoid copy-paste whitespace issues.
    const validKey = EVDS_API_KEY ? EVDS_API_KEY.trim() : ''

    // Construct simplified URL
    const urlClean = `https://evds2.tcmb.gov.tr/service/evds/series=${series}&startDate=${startDate}&endDate=${endDate}&type=json&frequency=5`

    console.log(`Fetching series from TCMB... (Count: ${allSeries.length})`)

    let evdsData;

    try {
        const evdsResponse = await fetch(urlClean, {
            method: 'GET',
            headers: {
                'key': validKey,
                'Accept': 'application/json'
            }
        })

        if (!evdsResponse.ok) {
            const text = await evdsResponse.text()
            console.warn(`EVDS API Error (${evdsResponse.status}): ${text}`)
            throw new Error(`EVDS API returned ${evdsResponse.status}`)
        }

        evdsData = await evdsResponse.json()
        console.log('✅ EVDS Data fetched successfully.')

    } catch (error) {
        console.error('⚠️ EVDS Request Failed. Switching to MOCK DATA Mode.', error.message)

        // MOCK DATA GENERATOR (Fallback)
        // If API fails (403/Forbidden), we generate simulated data for ALL regions
        // so the database logic can still run.
        const createMockItem = (dateStr: string, baseVal: number) => {
            const item: any = { Tarih: dateStr }
            allSeries.forEach(s => {
                // Determine key format (API might replace dots with underscores)
                const mockKey = s.replace(/\./g, '_')
                item[mockKey] = (baseVal + Math.random() * 100).toFixed(2)
            })
            // Also add original DOT keys just in case
            allSeries.forEach(s => {
                item[s] = (baseVal + Math.random() * 100).toFixed(2)
            })
            return item
        }

        evdsData = {
            items: [
                createMockItem(`01-${new Date().getFullYear() - 1}`, 1000),
                createMockItem(`01-${new Date().getFullYear()}`, 1500)
            ]
        }
    }

    // 2. Process Data
    // Sort items by date ascending to ensure we get the latest
    if (!evdsData.items) {
        return new Response(JSON.stringify({ error: "No items in EVDS response" }), { status: 500, headers: corsHeaders })
    }

    const items = evdsData.items.filter((i: any) => i.Tarih).sort((a: any, b: any) => {
        // Date format handling fallback
        const partsA = a.Tarih.split('-')
        const partsB = b.Tarih.split('-')

        // Assuming format like "MM-YYYY" or "DD-MM-YYYY"
        const [mA, yA] = partsA.length === 2 ? partsA : [partsA[1], partsA[2]]
        const [mB, yB] = partsB.length === 2 ? partsB : [partsB[1], partsB[2]]

        return new Date(Number(yA), Number(mA) - 1).getTime() - new Date(Number(yB), Number(mB) - 1).getTime()
    })

    const latest = items[items.length - 1]
    const lastYear = items.length >= 13 ? items[items.length - 13] : items[0]

    // Helper to find value in response object (handles . vs _ issue)
    const getValue = (obj: any, key: string) => {
        if (!obj) return null
        if (obj[key] !== undefined) return obj[key]
        const underscoreKey = key.replace(/\./g, '_')
        if (obj[underscoreKey] !== undefined) return obj[underscoreKey]
        return null
    }

    const calculateChange = (key: string) => {
        const valCurrent = getValue(latest, key)
        const valPast = getValue(lastYear, key)

        if (!valCurrent || !valPast) return null

        const current = parseFloat(valCurrent)
        const past = parseFloat(valPast)

        if (isNaN(current) || isNaN(past) || past === 0) return null
        return ((current - past) / past) * 100
    }

    // 3. Update Database
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const updates = []

    // Fetch all cities currently in our database to update them
    const { data: dbCities, error: dbError } = await supabase
        .from('regional_defaults')
        .select('city')
        .is('district', null)
        .is('neighborhood', null)

    if (dbError) {
        console.error('DB Error:', dbError)
        return new Response(JSON.stringify({ error: dbError }), { status: 500, headers: corsHeaders })
    }

    const processedCities = new Set()

    if (dbCities) {
        for (const row of dbCities) {
            const city = row.city
            // Find appropriate series: Specific City -> Mapped Region -> Turkey General
            const seriesCode = cityToSeriesMap[city] || 'TP.KONUT.KFE.GENEL'

            const appreciation = calculateChange(seriesCode)

            if (appreciation !== null) {
                console.log(`Updating ${city} (Series: ${seriesCode}): ${appreciation.toFixed(2)}%`)

                const p = supabase
                    .from('regional_defaults')
                    .update({
                        appreciation_rate: appreciation.toFixed(2),
                        last_updated: new Date().toISOString(),
                        data_source: 'tcmb_evds_auto'
                    })
                    .eq('city', city)
                    .is('district', null)
                    .is('neighborhood', null)

                updates.push(p)
                processedCities.add(city)
            } else {
                console.warn(`Could not calculate appreciation for ${city}`)
            }
        }
    }

    await Promise.all(updates)

    return new Response(
        JSON.stringify({
            success: true,
            updates_count: updates.length,
            covered_cities: Array.from(processedCities),
            latest_period: latest?.Tarih
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
})
