/**
 * Default constants for EmlakMetrik
 * These are fallback values used when regional data is not available
 */

export interface RegionalDefaults {
    // Location
    city: string;
    district: string | null;
    neighborhood: string | null;
    match_level: 'neighborhood' | 'district' | 'city' | 'country';

    // Price Defaults
    avg_price_per_sqm: number;
    avg_rent_per_sqm: number;
    avg_dues: number;

    // Appreciation & Growth
    appreciation_rate: number;
    rent_increase_rate: number;

    // Loan Defaults
    default_loan_rate: number;
    default_loan_term: number;
    default_down_payment: number;

    // Expense Rates
    deed_fee_rate: number;
    property_tax_rate: number;
    maintenance_rate: number;

    // Thresholds
    good_roi_threshold: number;
    good_amortization_threshold: number;

    // Metadata
    data_source: string;
    last_updated: string;
}

// Fallback defaults when no regional data is available
export const FALLBACK_DEFAULTS: RegionalDefaults = {
    city: 'Türkiye',
    district: null,
    neighborhood: null,
    match_level: 'country',

    // Price Defaults (Türkiye ortalaması)
    avg_price_per_sqm: 35000,
    avg_rent_per_sqm: 280,
    avg_dues: 500,

    // Appreciation & Growth
    appreciation_rate: 50,      // %50 yıllık değer artışı (yüksek enflasyon)
    rent_increase_rate: 25,     // %25 yıllık kira artışı

    // Loan Defaults
    default_loan_rate: 2.49,    // %2.49 aylık faiz
    default_loan_term: 120,     // 120 ay (10 yıl)
    default_down_payment: 20,   // %20 peşinat

    // Expense Rates
    deed_fee_rate: 0.04,        // %4 tapu harcı
    property_tax_rate: 0.002,   // %0.2 emlak vergisi (yıllık)
    maintenance_rate: 0.10,     // %10 bakım (kiranın yüzdesi)

    // Thresholds
    good_roi_threshold: 5,              // %5 üzeri iyi ROI
    good_amortization_threshold: 20,    // 20 yıl altı iyi amortisman

    // Metadata
    data_source: 'fallback',
    last_updated: new Date().toISOString(),
};

// City name mappings for flexible search
export const CITY_ALIASES: Record<string, string> = {
    'istanbul': 'İstanbul',
    'izmir': 'İzmir',
    'ankara': 'Ankara',
    'antalya': 'Antalya',
    'bursa': 'Bursa',
    'karsiyaka': 'Karşıyaka',
    'kadikoy': 'Kadıköy',
    'besiktas': 'Beşiktaş',
    'cankaya': 'Çankaya',
    'ornekköy': 'Örnekköy',
    'ornekoy': 'Örnekköy',
};

// Normalize location text (remove Turkish characters issues)
export const normalizeLocation = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/i̇/g, 'i')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
};

// Parse location string like "İzmir, Karşıyaka" into components
export const parseLocationString = (locationStr: string): { city: string; district: string | null; neighborhood: string | null } => {
    const parts = locationStr.split(',').map(p => p.trim());

    let city = parts[0] || '';
    let district = parts[1] || null;
    let neighborhood = parts[2] || null;

    // Apply aliases
    const normalizedCity = normalizeLocation(city);
    if (CITY_ALIASES[normalizedCity]) {
        city = CITY_ALIASES[normalizedCity];
    }

    if (district) {
        const normalizedDistrict = normalizeLocation(district);
        if (CITY_ALIASES[normalizedDistrict]) {
            district = CITY_ALIASES[normalizedDistrict];
        }
    }

    if (neighborhood) {
        const normalizedNeighborhood = normalizeLocation(neighborhood);
        if (CITY_ALIASES[normalizedNeighborhood]) {
            neighborhood = CITY_ALIASES[normalizedNeighborhood];
        }
    }

    return { city, district, neighborhood };
};

// Slider limits
export const SLIDER_LIMITS = {
    loanRate: { min: 0, max: 5, step: 0.01 },
    loanTerm: { min: 12, max: 180, step: 12 },
    downPayment: { min: 10, max: 50, step: 5 },
    appreciation: { min: 0, max: 100, step: 5 },
};
