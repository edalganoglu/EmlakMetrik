import { Skeleton } from '@/components/Skeleton';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Svg, { Circle, G } from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;
const PDF_CREDIT_COST = 10;

interface MarketComparison {
    avgPricePerSqm: number;
    propertyPricePerSqm: number;
    difference: number;
    differencePercent: number;
    isBelowMarket: boolean;
}

interface PropertyResults {
    amortization: number;
    roi: number;
    cashOnCashReturn: number;
    grossRoi: number;
    totalInitialCost: number;
    totalPropertyCost: number;
    netMonthlyIncome: number;
    monthlyExpenses: number;
    useLoan: boolean;
    loanAmount: number;
    downPayment: number;
    monthlyLoanPayment: number;
    loanTerm: number;
    loanRate: number;
    appreciationRate: number;
    marketComparison: MarketComparison | null;
    comparables: Array<{ sqm: string; price: string }>;
    propertySquareMeters: number;
    pricePerSqm: number;
}

interface UserProfile {
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    credit_balance: number;
}

export default function AnalysisResultScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        fetchProperty();
        fetchUserProfile();
    }, [id]);

    const [balance, setBalance] = useState(0);

    const fetchUserProfile = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            const { data } = await supabase
                .from('profiles')
                .select('full_name, avatar_url, phone, credit_balance')
                .eq('id', authUser.id)
                .single();
            if (data) {
                setUserProfile(data);
                setBalance(data.credit_balance);
            }
        }
    }

    const fetchProperty = async () => {
        if (!id) return;
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', id)
            .single();

        if (data) setProperty(data);
        setLoading(false);
    };

    const generatePDF = async () => {
        if (!property) return;
        if (!user) {
            Alert.alert('Hata', 'Oturum açmanız gerekiyor.');
            return;
        }

        // Check credit balance
        if (balance < PDF_CREDIT_COST) {
            Alert.alert(
                'Yetersiz Kredi',
                `PDF raporu oluşturmak için ${PDF_CREDIT_COST} kredi gerekiyor. Mevcut bakiyeniz: ${balance} kredi.`,
                [
                    { text: 'İptal', style: 'cancel' },
                    { text: 'Kredi Al', onPress: () => router.push('/wallet') }
                ]
            );
            return;
        }

        // Confirm cost
        Alert.alert(
            'PDF Raporu Oluştur',
            `Bu işlem ${PDF_CREDIT_COST} kredi harcayacaktır. Devam etmek istiyor musunuz?`,
            [
                { text: 'İptal', style: 'cancel' },
                { text: 'Oluştur', onPress: () => createPDF() }
            ]
        );
    };

    const createPDF = async () => {
        setPdfLoading(true);

        try {
            // Deduct credits first
            const { error: txError } = await supabase.from('wallet_transactions').insert({
                user_id: user!.id,
                amount: -PDF_CREDIT_COST,
                type: 'spend',
                description: `PDF Rapor: ${property.title || property.location}`
            });

            if (txError) {
                Alert.alert('Hata', 'Kredi düşürülürken bir sorun oluştu.');
                setPdfLoading(false);
                return;
            }

            // Update local balance
            setBalance(prev => prev - PDF_CREDIT_COST);

            const results: PropertyResults = property.params?.results || {};
            const currentYear = new Date().getFullYear();
            const reportDate = new Date().toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });

            // Agent info
            const agentName = userProfile?.full_name || 'Emlak Danışmanı';
            const agentPhone = userProfile?.phone || '';
            const agentAvatar = userProfile?.avatar_url || '';

            const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Emlak Yatırım Analiz Raporu</title>
                <style>
                    @page { margin: 0; }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        background: #ffffff; 
                        color: #1e293b; 
                        padding: 40px;
                        line-height: 1.6;
                        font-size: 14px;
                    }
                    
                    /* Header with Logo and Agent Info */
                    .report-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        padding-bottom: 24px;
                        border-bottom: 3px solid #2563eb;
                        margin-bottom: 32px;
                    }
                    .logo-section {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    .logo-icon {
                        width: 48px;
                        height: 48px;
                        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #fff;
                        font-size: 24px;
                        font-weight: bold;
                    }
                    .logo-text {
                        font-size: 28px;
                        font-weight: 800;
                        color: #1e293b;
                        letter-spacing: -0.5px;
                    }
                    .logo-subtitle {
                        font-size: 12px;
                        color: #64748b;
                        font-weight: 500;
                    }
                    
                    .agent-section {
                        text-align: right;
                        display: flex;
                        align-items: center;
                        gap: 16px;
                    }
                    .agent-info {
                        text-align: right;
                    }
                    .agent-name {
                        font-size: 16px;
                        font-weight: 700;
                        color: #1e293b;
                        margin-bottom: 2px;
                    }
                    .agent-title {
                        font-size: 12px;
                        color: #64748b;
                        margin-bottom: 4px;
                    }
                    .agent-contact {
                        font-size: 12px;
                        color: #2563eb;
                        font-weight: 600;
                    }
                    .agent-avatar {
                        width: 64px;
                        height: 64px;
                        border-radius: 50%;
                        object-fit: cover;
                        border: 3px solid #e2e8f0;
                    }
                    .agent-avatar-placeholder {
                        width: 64px;
                        height: 64px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #fff;
                        font-size: 28px;
                        font-weight: bold;
                    }
                    
                    /* Property Title */
                    .property-header {
                        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 24px;
                        margin-bottom: 24px;
                    }
                    .property-title {
                        font-size: 22px;
                        font-weight: 700;
                        color: #1e293b;
                        margin-bottom: 8px;
                    }
                    .property-location {
                        font-size: 14px;
                        color: #64748b;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        margin-bottom: 16px;
                    }
                    .property-price {
                        font-size: 28px;
                        font-weight: 800;
                        color: #2563eb;
                    }
                    .report-meta {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 16px;
                        padding-top: 16px;
                        border-top: 1px solid #e2e8f0;
                    }
                    .meta-item {
                        text-align: center;
                    }
                    .meta-label {
                        font-size: 11px;
                        color: #94a3b8;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .meta-value {
                        font-size: 14px;
                        font-weight: 600;
                        color: #334155;
                    }
                    
                    /* Key Metrics Banner */
                    .metrics-banner {
                        display: flex;
                        gap: 16px;
                        margin-bottom: 24px;
                    }
                    .metric-box {
                        flex: 1;
                        background: #fff;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 20px;
                        text-align: center;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    }
                    .metric-box.highlight {
                        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                        border: none;
                        color: #fff;
                    }
                    .metric-label {
                        font-size: 11px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: #64748b;
                        margin-bottom: 8px;
                    }
                    .metric-box.highlight .metric-label {
                        color: rgba(255,255,255,0.8);
                    }
                    .metric-value {
                        font-size: 28px;
                        font-weight: 800;
                        color: #1e293b;
                    }
                    .metric-box.highlight .metric-value {
                        color: #fff;
                    }
                    .metric-unit {
                        font-size: 14px;
                        font-weight: 500;
                    }
                    .metric-status {
                        font-size: 11px;
                        font-weight: 600;
                        padding: 4px 10px;
                        border-radius: 20px;
                        margin-top: 8px;
                        display: inline-block;
                    }
                    .status-good { background: #dcfce7; color: #166534; }
                    .status-warning { background: #fef9c3; color: #854d0e; }
                    .status-bad { background: #fee2e2; color: #991b1b; }
                    
                    /* Section */
                    .section {
                        background: #fff;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        margin-bottom: 20px;
                        overflow: hidden;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    }
                    .section-header {
                        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                        padding: 16px 20px;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    .section-title {
                        font-size: 16px;
                        font-weight: 700;
                        color: #1e293b;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .section-icon {
                        width: 24px;
                        height: 24px;
                        background: #2563eb;
                        border-radius: 6px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #fff;
                        font-size: 12px;
                    }
                    .section-body {
                        padding: 20px;
                    }
                    
                    /* Data Rows */
                    .data-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px 0;
                        border-bottom: 1px solid #f1f5f9;
                    }
                    .data-row:last-child {
                        border-bottom: none;
                    }
                    .data-row.highlight {
                        background: #f8fafc;
                        margin: 0 -20px;
                        padding: 12px 20px;
                    }
                    .data-label {
                        color: #64748b;
                        font-size: 14px;
                    }
                    .data-value {
                        font-weight: 600;
                        color: #1e293b;
                        font-size: 14px;
                    }
                    .data-value.positive { color: #16a34a; }
                    .data-value.negative { color: #dc2626; }
                    .data-value.primary { color: #2563eb; }
                    .data-description {
                        font-size: 12px;
                        color: #94a3b8;
                        margin-top: 4px;
                    }
                    
                    /* Two Column Grid */
                    .two-col {
                        display: flex;
                        gap: 20px;
                    }
                    .two-col > div {
                        flex: 1;
                    }
                    
                    /* Badge */
                    .badge {
                        display: inline-block;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 600;
                    }
                    .badge-success { background: #dcfce7; color: #166534; }
                    .badge-danger { background: #fee2e2; color: #991b1b; }
                    .badge-warning { background: #fef9c3; color: #854d0e; }
                    .badge-info { background: #dbeafe; color: #1d4ed8; }
                    
                    /* Analysis Notes */
                    .analysis-notes {
                        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                        border: 1px solid #bae6fd;
                        border-radius: 12px;
                        padding: 20px;
                        margin-bottom: 20px;
                    }
                    .notes-title {
                        font-size: 14px;
                        font-weight: 700;
                        color: #0369a1;
                        margin-bottom: 12px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .notes-content {
                        font-size: 13px;
                        color: #0c4a6e;
                        line-height: 1.7;
                    }
                    .notes-content ul {
                        margin-left: 20px;
                        margin-top: 8px;
                    }
                    .notes-content li {
                        margin-bottom: 6px;
                    }
                    
                    /* Footer */
                    .report-footer {
                        margin-top: 40px;
                        padding-top: 24px;
                        border-top: 2px solid #e2e8f0;
                        text-align: center;
                    }
                    .footer-brand {
                        font-size: 16px;
                        font-weight: 700;
                        color: #2563eb;
                        margin-bottom: 8px;
                    }
                    .footer-text {
                        font-size: 11px;
                        color: #94a3b8;
                        line-height: 1.6;
                    }
                    .footer-disclaimer {
                        font-size: 10px;
                        color: #cbd5e1;
                        margin-top: 16px;
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 8px;
                    }
                    
                    /* Warning Box */
                    .warning-box {
                        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                        border: 1px solid #f59e0b;
                        border-radius: 12px;
                        padding: 16px 20px;
                        margin-bottom: 20px;
                    }
                    .warning-title {
                        font-size: 14px;
                        font-weight: 700;
                        color: #92400e;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 8px;
                    }
                    .warning-text {
                        font-size: 13px;
                        color: #78350f;
                    }
                    
                    /* Success Box */
                    .success-box {
                        background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
                        border: 1px solid #22c55e;
                        border-radius: 12px;
                        padding: 16px 20px;
                        margin-bottom: 20px;
                    }
                    .success-title {
                        font-size: 14px;
                        font-weight: 700;
                        color: #166534;
                        margin-bottom: 8px;
                    }
                    .success-text {
                        font-size: 13px;
                        color: #14532d;
                    }
                </style>
            </head>
            <body>
                <!-- Header with Logo and Agent -->
                <div class="report-header">
                    <div class="logo-section">
                        <div class="logo-icon">E</div>
                        <div>
                            <div class="logo-text">EmlakMetrik</div>
                            <div class="logo-subtitle">Profesyonel Gayrimenkul Analizi</div>
                        </div>
                    </div>
                    <div class="agent-section">
                        <div class="agent-info">
                            <div class="agent-name">${agentName}</div>
                            <div class="agent-title">Gayrimenkul Danışmanı</div>
                            ${agentPhone ? `<div class="agent-contact">${agentPhone}</div>` : ''}
                        </div>
                        ${agentAvatar ?
                    `<img src="${agentAvatar}" class="agent-avatar" alt="Danışman" />` :
                    `<div class="agent-avatar-placeholder">${agentName.charAt(0).toUpperCase()}</div>`
                }
                    </div>
                </div>
                
                <!-- Property Info -->
                <div class="property-header">
                    <div class="property-title">${property.title || 'Yatırım Mülkü Analizi'}</div>
                    <div class="property-location">📍 ${property.location || 'Konum Belirtilmemiş'}</div>
                    <div class="property-price">₺${(property.price || 0).toLocaleString('tr-TR')}</div>
                    <div class="report-meta">
                        <div class="meta-item">
                            <div class="meta-label">Rapor Tarihi</div>
                            <div class="meta-value">${reportDate}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Rapor No</div>
                            <div class="meta-value">EM-${id?.toString().slice(-6).toUpperCase() || '000000'}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Mülk Alanı</div>
                            <div class="meta-value">${results.propertySquareMeters || 0} m²</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">m² Fiyatı</div>
                            <div class="meta-value">₺${(results.pricePerSqm || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Key Metrics -->
                <div class="metrics-banner">
                    <div class="metric-box highlight">
                        <div class="metric-label">Amortisman Süresi</div>
                        <div class="metric-value">${(results.amortization || 0).toFixed(1)} <span class="metric-unit">Yıl</span></div>
                        <div class="metric-status ${(results.amortization || 0) <= 15 ? 'status-good' : (results.amortization || 0) <= 25 ? 'status-warning' : 'status-bad'}" style="background: rgba(255,255,255,0.2); color: #fff;">
                            ${(results.amortization || 0) <= 15 ? 'Mükemmel' : (results.amortization || 0) <= 25 ? 'Ortalama' : 'Uzun Vadeli'}
                        </div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">${results.useLoan ? 'Cash on Cash ROI' : 'Yıllık Getiri'}</div>
                        <div class="metric-value" style="color: ${(results.roi || 0) > 5 ? '#16a34a' : '#f59e0b'}">%${(results.roi || 0).toFixed(1)}</div>
                        <div class="metric-status ${(results.roi || 0) > 8 ? 'status-good' : (results.roi || 0) > 4 ? 'status-warning' : 'status-bad'}">
                            ${(results.roi || 0) > 8 ? 'Yüksek Getiri' : (results.roi || 0) > 4 ? 'Orta Getiri' : 'Düşük Getiri'}
                        </div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">Net Aylık Gelir</div>
                        <div class="metric-value" style="color: ${(results.netMonthlyIncome || 0) >= 0 ? '#16a34a' : '#dc2626'}">
                            ₺${Math.abs(results.netMonthlyIncome || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                        </div>
                        <div class="metric-status ${(results.netMonthlyIncome || 0) >= 0 ? 'status-good' : 'status-bad'}">
                            ${(results.netMonthlyIncome || 0) >= 0 ? 'Pozitif Nakit Akışı' : 'Negatif Nakit Akışı'}
                        </div>
                    </div>
                </div>
                
                ${(results.netMonthlyIncome || 0) < 0 ? `
                <div class="warning-box">
                    <div class="warning-title">⚠️ Dikkat: Negatif Nakit Akışı</div>
                    <div class="warning-text">
                        Bu yatırım aylık <strong>₺${Math.abs(results.netMonthlyIncome || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</strong> ek sermaye gerektirir. 
                        Kira geliri, aylık giderleri (aidat + kredi taksiti) karşılamamaktadır. 
                        Yatırım kararı vermeden önce nakit akışı planlaması yapmanız önerilir.
                    </div>
                </div>
                ` : `
                <div class="success-box">
                    <div class="success-title">✅ Pozitif Nakit Akışı</div>
                    <div class="success-text">
                        Bu mülk aylık <strong>₺${(results.netMonthlyIncome || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</strong> net gelir üretmektedir. 
                        Kira geliri, tüm aylık giderleri karşıladıktan sonra kâr bırakmaktadır.
                    </div>
                </div>
                `}
                
                <div class="two-col">
                    <!-- Cost Analysis -->
                    <div>
                        <div class="section">
                            <div class="section-header">
                                <div class="section-title">
                                    <span class="section-icon">💰</span>
                                    Maliyet Analizi
                                </div>
                            </div>
                            <div class="section-body">
                                <div class="data-row">
                                    <span class="data-label">Satış Fiyatı</span>
                                    <span class="data-value">₺${(property.price || 0).toLocaleString('tr-TR')}</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Tapu Harcı (%4)</span>
                                    <span class="data-value">₺${((property.price || 0) * 0.04).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Tadilat/Renovasyon</span>
                                    <span class="data-value">₺${(property.params?.renovation || 0).toLocaleString('tr-TR')}</span>
                                </div>
                                ${results.useLoan ? `
                                <div class="data-row">
                                    <span class="data-label">Peşinat</span>
                                    <span class="data-value">₺${(results.downPayment || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                                </div>
                                ` : ''}
                                <div class="data-row highlight">
                                    <span class="data-label"><strong>Toplam Başlangıç Maliyeti</strong></span>
                                    <span class="data-value primary"><strong>₺${(results.totalInitialCost || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Income Analysis -->
                    <div>
                        <div class="section">
                            <div class="section-header">
                                <div class="section-title">
                                    <span class="section-icon">📊</span>
                                    Gelir-Gider Analizi
                                </div>
                            </div>
                            <div class="section-body">
                                <div class="data-row">
                                    <span class="data-label">Aylık Kira Geliri</span>
                                    <span class="data-value positive">+₺${(property.monthly_rent || 0).toLocaleString('tr-TR')}</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Aylık Aidat</span>
                                    <span class="data-value negative">-₺${(property.params?.dues || 0).toLocaleString('tr-TR')}</span>
                                </div>
                                ${results.useLoan ? `
                                <div class="data-row">
                                    <span class="data-label">Aylık Kredi Taksiti</span>
                                    <span class="data-value negative">-₺${(results.monthlyLoanPayment || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                                </div>
                                ` : ''}
                                <div class="data-row highlight">
                                    <span class="data-label"><strong>Net Aylık Nakit Akışı</strong></span>
                                    <span class="data-value ${(results.netMonthlyIncome || 0) >= 0 ? 'positive' : 'negative'}">
                                        <strong>₺${(results.netMonthlyIncome || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${results.useLoan ? `
                <!-- Loan Details -->
                <div class="section">
                    <div class="section-header">
                        <div class="section-title">
                            <span class="section-icon">🏦</span>
                            Kredi Finansman Detayları
                        </div>
                    </div>
                    <div class="section-body">
                        <div class="two-col">
                            <div>
                                <div class="data-row">
                                    <span class="data-label">Kredi Tutarı</span>
                                    <span class="data-value">₺${(results.loanAmount || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Aylık Faiz Oranı</span>
                                    <span class="data-value">%${(results.loanRate || 0).toFixed(2)}</span>
                                </div>
                            </div>
                            <div>
                                <div class="data-row">
                                    <span class="data-label">Vade Süresi</span>
                                    <span class="data-value">${results.loanTerm || 0} Ay (${((results.loanTerm || 0) / 12).toFixed(0)} Yıl)</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Aylık Taksit</span>
                                    <span class="data-value negative">₺${(results.monthlyLoanPayment || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                ${results.marketComparison ? `
                <!-- Market Comparison -->
                <div class="section">
                    <div class="section-header">
                        <div class="section-title">
                            <span class="section-icon">📈</span>
                            Piyasa Karşılaştırması
                        </div>
                    </div>
                    <div class="section-body">
                        <div class="data-row">
                            <span class="data-label">Bu Mülk m² Fiyatı</span>
                            <span class="data-value">₺${results.marketComparison.propertyPricePerSqm.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div class="data-row">
                            <span class="data-label">Bölge Ortalama m² Fiyatı</span>
                            <span class="data-value">₺${results.marketComparison.avgPricePerSqm.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div class="data-row highlight">
                            <span class="data-label"><strong>Piyasa Farkı</strong></span>
                            <span class="data-value">
                                <span class="badge ${results.marketComparison.isBelowMarket ? 'badge-success' : 'badge-danger'}">
                                    ${results.marketComparison.isBelowMarket ? '↓ Piyasanın Altında' : '↑ Piyasanın Üstünde'} 
                                    (%${Math.abs(results.marketComparison.differencePercent).toFixed(1)})
                                </span>
                            </span>
                        </div>
                        <div class="data-description" style="margin-top: 12px; padding: 12px; background: #f8fafc; border-radius: 8px;">
                            ${results.marketComparison.isBelowMarket ?
                        `✅ <strong>Cazip Fiyat:</strong> Bu mülk, bölge ortalamasının %${Math.abs(results.marketComparison.differencePercent).toFixed(1)} altında fiyatlandırılmış. Bu durum potansiyel bir değer artışı fırsatı sunabilir.` :
                        `⚠️ <strong>Dikkat:</strong> Bu mülk, bölge ortalamasının %${results.marketComparison.differencePercent.toFixed(1)} üzerinde fiyatlandırılmış. Fiyat pazarlığı veya özel özelliklerin değerlendirilmesi önerilir.`
                    }
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <!-- Analysis Notes -->
                <div class="analysis-notes">
                    <div class="notes-title">📋 Analiz Değerlendirmesi</div>
                    <div class="notes-content">
                        <p>Bu yatırım analizi, girilen veriler temel alınarak hazırlanmıştır. Değerlendirme özeti:</p>
                        <ul>
                            <li><strong>Amortisman:</strong> ${(results.amortization || 0).toFixed(1)} yıl - ${(results.amortization || 0) <= 15 ? 'Yatırımın geri dönüş süresi ideal seviyede.' : (results.amortization || 0) <= 25 ? 'Orta vadeli bir yatırım planı gerektirir.' : 'Uzun vadeli değer artışı beklentisi ile yatırım yapılmalıdır.'}</li>
                            <li><strong>Getiri Oranı:</strong> Yıllık %${(results.roi || 0).toFixed(1)} - ${(results.roi || 0) > 8 ? 'Piyasa ortalamasının üzerinde getiri potansiyeli.' : (results.roi || 0) > 4 ? 'Standart kira getirisi beklentisi.' : 'Düşük getiri oranı, alternatif yatırımlar değerlendirilebilir.'}</li>
                            <li><strong>Nakit Akışı:</strong> ${(results.netMonthlyIncome || 0) >= 0 ? `Aylık ₺${(results.netMonthlyIncome || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} net gelir - Kendi kendini finanse eden yatırım.` : `Aylık ₺${Math.abs(results.netMonthlyIncome || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ek sermaye gereksinimi var.`}</li>
                            ${results.useLoan ? `<li><strong>Finansman:</strong> Kredili alımda toplam ₺${(results.totalInitialCost || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} başlangıç sermayesi gereklidir.</li>` : ''}
                        </ul>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="report-footer">
                    <div class="footer-brand">EmlakMetrik</div>
                    <div class="footer-text">
                        Profesyonel Gayrimenkul Yatırım Analiz Platformu<br>
                        Bu rapor ${reportDate} tarihinde oluşturulmuştur.
                    </div>
                    <div class="footer-disclaimer">
                        <strong>Sorumluluk Reddi:</strong> Bu rapor yalnızca bilgilendirme amaçlıdır ve yatırım tavsiyesi niteliği taşımaz. 
                        Tüm veriler kullanıcı tarafından girilmiştir. Yatırım kararları vermeden önce profesyonel danışmanlık hizmeti almanız önerilir. 
                        EmlakMetrik, bu raporda yer alan bilgilerin doğruluğu veya tamlığı konusunda herhangi bir garanti vermez.
                        <br><br>© ${currentYear} EmlakMetrik - Tüm hakları saklıdır.
                    </div>
                </div>
            </body>
            </html>
            `;

            const { uri } = await Print.printToFileAsync({
                html: htmlContent,
                base64: false
            });

            if (Platform.OS === 'ios') {
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            } else {
                await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
            }

            // Mark as PDF generated in database
            await supabase
                .from('properties')
                .update({
                    pdf_generated: true,
                    pdf_generated_at: new Date().toISOString()
                })
                .eq('id', id);

        } catch (error) {
            console.error('PDF Error:', error);
            Alert.alert('Hata', 'PDF oluşturulurken bir sorun oluştu.');
            // Refund credits on error
            await supabase.from('wallet_transactions').insert({
                user_id: user!.id,
                amount: PDF_CREDIT_COST,
                type: 'refund',
                description: 'PDF oluşturma hatası - kredi iadesi'
            });
            setBalance(prev => prev + PDF_CREDIT_COST);
        } finally {
            setPdfLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Skeleton width={40} height={40} borderRadius={20} />
                    <Skeleton width={150} height={24} />
                    <Skeleton width={40} height={40} borderRadius={20} />
                </View>

                <View style={styles.content}>
                    <View style={styles.card}>
                        <Skeleton width={120} height={24} style={{ marginBottom: 16 }} />
                        <View style={styles.overviewGrid}>
                            <View>
                                <Skeleton width={80} height={14} style={{ marginBottom: 4 }} />
                                <Skeleton width={60} height={24} />
                            </View>
                            <View>
                                <Skeleton width={80} height={14} style={{ marginBottom: 4 }} />
                                <Skeleton width={60} height={24} />
                            </View>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Skeleton width="100%" height={200} borderRadius={16} />
                    </View>
                </View>
            </View>
        );
    }

    if (!property) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: Colors.dark.text }}>Analiz bulunamadı</Text>
            </View>
        )
    }

    // derived values
    const results: PropertyResults = property.params?.results || {};
    const amortization = results.amortization || 0;
    const roi = results.roi || 0;
    const price = property.price || 0;
    const monthlyRent = property.monthly_rent || 0;
    const dues = property.params?.dues || 0;
    const appreciationRate = results.appreciationRate || 50; // Default %50 for Turkey

    // Expense Calculations - Dinamik
    const tax = price * 0.002; // Yıllık emlak vergisi tahmini
    const maintenance = monthlyRent * 0.1 * 12; // Bakım tahmini (kira gelirinin %10'u)
    const annualDues = dues * 12;
    const annualLoanPayment = results.useLoan ? (results.monthlyLoanPayment || 0) * 12 : 0;

    // Donut Chart için gider kalemleri
    const expenseItems = [
        { name: 'Vergi', value: tax, color: '#135bec' },
        { name: 'Aidat', value: annualDues, color: '#60a5fa' },
        { name: 'Bakım', value: maintenance, color: '#93c5fd' },
    ];

    if (results.useLoan && annualLoanPayment > 0) {
        expenseItems.push({ name: 'Kredi Taksiti', value: annualLoanPayment, color: '#ef4444' });
    }

    const totalAnnualExpense = expenseItems.reduce((acc, item) => acc + item.value, 0);

    // Dinamik Projeksiyon - Kullanıcının girdiği değer artış oranına göre
    const currentYear = new Date().getFullYear();
    const projectionYears = [0, 2, 4, 6, 8, 10];
    const projectionLabels = projectionYears.map(y => (currentYear + y).toString());
    const projectionData = projectionYears.map(y => price * Math.pow(1 + appreciationRate / 100, y));

    // Donut Chart SVG hesaplaması
    const radius = 40;
    const circumference = 2 * Math.PI * radius; // ~251.33

    const calculateDonutSegments = () => {
        let cumulativeOffset = 0;
        return expenseItems.map((item) => {
            const percentage = totalAnnualExpense > 0 ? item.value / totalAnnualExpense : 0;
            const strokeLength = percentage * circumference;
            const segment = {
                ...item,
                strokeDasharray: `${strokeLength} ${circumference - strokeLength}`,
                strokeDashoffset: -cumulativeOffset,
                percentage: percentage * 100
            };
            cumulativeOffset += strokeLength;
            return segment;
        });
    };

    const donutSegments = calculateDonutSegments();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Analiz Sonuçları</Text>
                <TouchableOpacity style={styles.iconButton}>
                    <MaterialIcons name="share" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
            </View>

            {/* Sticky Action Bar */}
            <View style={styles.stickyBar}>
                <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Mevcut Bakiye</Text>
                    <View style={styles.balanceValueContainer}>
                        <MaterialIcons name="monetization-on" size={18} color="#f59e0b" />
                        <Text style={styles.balanceValueText}>{balance} Kredi</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.pdfButton, pdfLoading && styles.pdfButtonDisabled]}
                    onPress={generatePDF}
                    disabled={pdfLoading}
                >
                    <MaterialIcons name="picture-as-pdf" size={20} color="#fff" />
                    <Text style={styles.pdfButtonText}>
                        {pdfLoading ? 'Oluşturuluyor...' : 'PDF Rapor Oluştur'}
                    </Text>
                    <View style={styles.costBadge}>
                        <Text style={styles.costText}>10 Kredi</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Property Info */}
                <View style={styles.propertyHeader}>
                    <Text style={styles.propertyTitle}>{property.title || 'Mülk Analizi'}</Text>
                    <Text style={styles.propertyLocation}>{property.location}</Text>
                    <Text style={styles.propertyPrice}>₺{price.toLocaleString('tr-TR')}</Text>
                </View>

                {/* Negative Cash Flow Warning */}
                {(results.netMonthlyIncome || 0) < 0 && (
                    <View style={styles.warningCard}>
                        <View style={styles.warningHeader}>
                            <MaterialIcons name="warning" size={24} color="#f59e0b" />
                            <Text style={styles.warningTitle}>Dikkat: Negatif Nakit Akışı</Text>
                        </View>
                        <Text style={styles.warningText}>
                            Bu yatırım aylık{' '}
                            <Text style={styles.warningHighlight}>
                                ₺{Math.abs(results.netMonthlyIncome || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                            </Text>
                            {' '}ek nakit gerektirir. Kredi taksiti kira gelirini aşıyor.
                        </Text>
                        {results.useLoan && (
                            <View style={styles.warningDetails}>
                                <View style={styles.warningRow}>
                                    <Text style={styles.warningLabel}>Aylık Kira Geliri</Text>
                                    <Text style={styles.warningValuePositive}>+₺{monthlyRent.toLocaleString('tr-TR')}</Text>
                                </View>
                                <View style={styles.warningRow}>
                                    <Text style={styles.warningLabel}>Aylık Giderler (Taksit + Aidat)</Text>
                                    <Text style={styles.warningValueNegative}>
                                        -₺{(results.monthlyExpenses || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                                    </Text>
                                </View>
                                <View style={[styles.warningRow, styles.warningRowTotal]}>
                                    <Text style={styles.warningLabelBold}>Net Fark</Text>
                                    <Text style={styles.warningValueNegative}>
                                        ₺{(results.netMonthlyIncome || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                                    </Text>
                                </View>
                            </View>
                        )}
                        <Text style={styles.warningFooter}>
                            💡 Öneri: Daha yüksek peşinat oranı veya kredisiz alım düşünebilirsiniz.
                        </Text>
                    </View>
                )}

                {/* General Overview */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Genel Bakış</Text>
                    <View style={styles.overviewGrid}>
                        <View style={styles.overviewItem}>
                            <Text style={styles.overviewLabel}>Amortisman</Text>
                            <Text style={styles.overviewValue}>{amortization.toFixed(1)} Yıl</Text>
                            <View style={[styles.trendBadge, amortization > 20 ? styles.trendBadgeBad : styles.trendBadgeGood]}>
                                <MaterialIcons
                                    name={amortization > 20 ? "trending-up" : "trending-down"}
                                    size={14}
                                    color={amortization > 20 ? "#ef4444" : "#10b981"}
                                />
                                <Text style={[styles.trendText, amortization > 20 ? { color: '#ef4444' } : { color: '#10b981' }]}>
                                    {amortization > 20 ? 'Uzun' : 'İyi'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.overviewItem}>
                            <Text style={styles.overviewLabel}>
                                {results.useLoan ? 'Cash on Cash ROI' : 'Yıllık ROI'}
                            </Text>
                            <Text style={styles.overviewValue}>%{roi.toFixed(1)}</Text>
                            <View style={[styles.trendBadge, roi < 5 ? styles.trendBadgeBad : styles.trendBadgeGood]}>
                                <MaterialIcons
                                    name={roi < 5 ? "trending-down" : "trending-up"}
                                    size={14}
                                    color={roi < 5 ? "#ef4444" : "#10b981"}
                                />
                                <Text style={[styles.trendText, roi < 5 ? { color: '#ef4444' } : { color: '#10b981' }]}>
                                    {roi < 5 ? 'Düşük' : 'İyi'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Net Monthly Income */}
                    <View style={styles.netIncomeRow}>
                        <View>
                            <Text style={styles.netIncomeLabel}>Net Aylık Gelir</Text>
                            <Text style={styles.netIncomeSubtitle}>Kira - Giderler</Text>
                        </View>
                        <Text style={[
                            styles.netIncomeValue,
                            (results.netMonthlyIncome || 0) < 0 && styles.netIncomeNegative
                        ]}>
                            ₺{(results.netMonthlyIncome || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                        </Text>
                    </View>
                </View>

                {/* Loan Details Card */}
                {results.useLoan && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Kredi Bilgileri</Text>
                            <View style={styles.loanBadge}>
                                <MaterialIcons name="account-balance" size={14} color="#f59e0b" />
                                <Text style={styles.loanBadgeText}>Kredili</Text>
                            </View>
                        </View>

                        <View style={styles.loanDetailsGrid}>
                            <View style={styles.loanDetailItem}>
                                <Text style={styles.loanDetailLabel}>Peşinat</Text>
                                <Text style={styles.loanDetailValue}>
                                    ₺{(results.downPayment || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                                </Text>
                            </View>
                            <View style={styles.loanDetailItem}>
                                <Text style={styles.loanDetailLabel}>Kredi Tutarı</Text>
                                <Text style={styles.loanDetailValue}>
                                    ₺{(results.loanAmount || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                                </Text>
                            </View>
                            <View style={styles.loanDetailItem}>
                                <Text style={styles.loanDetailLabel}>Aylık Taksit</Text>
                                <Text style={[styles.loanDetailValue, { color: '#ef4444' }]}>
                                    ₺{(results.monthlyLoanPayment || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                                </Text>
                            </View>
                            <View style={styles.loanDetailItem}>
                                <Text style={styles.loanDetailLabel}>Vade</Text>
                                <Text style={styles.loanDetailValue}>
                                    {results.loanTerm || 0} Ay
                                </Text>
                            </View>
                        </View>

                        <View style={styles.loanSummary}>
                            <Text style={styles.loanSummaryLabel}>Toplam Cepten Çıkan (Başlangıç)</Text>
                            <Text style={styles.loanSummaryValue}>
                                ₺{(results.totalInitialCost || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Market Comparison Card */}
                {results.marketComparison && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Piyasa Karşılaştırması</Text>
                            <View style={[
                                styles.marketBadge,
                                results.marketComparison.isBelowMarket ? styles.marketBadgeGood : styles.marketBadgeBad
                            ]}>
                                <Text style={[
                                    styles.marketBadgeText,
                                    results.marketComparison.isBelowMarket ? { color: '#10b981' } : { color: '#ef4444' }
                                ]}>
                                    {results.marketComparison.isBelowMarket ? 'Cazip Fiyat' : 'Pahalı'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.marketComparisonGrid}>
                            <View style={styles.marketComparisonItem}>
                                <Text style={styles.marketLabel}>Bu Mülk</Text>
                                <Text style={styles.marketValue}>
                                    ₺{results.marketComparison.propertyPricePerSqm.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}/m²
                                </Text>
                            </View>
                            <View style={styles.marketComparisonDivider}>
                                <MaterialIcons
                                    name={results.marketComparison.isBelowMarket ? "arrow-downward" : "arrow-upward"}
                                    size={24}
                                    color={results.marketComparison.isBelowMarket ? "#10b981" : "#ef4444"}
                                />
                            </View>
                            <View style={styles.marketComparisonItem}>
                                <Text style={styles.marketLabel}>Piyasa Ort.</Text>
                                <Text style={styles.marketValue}>
                                    ₺{results.marketComparison.avgPricePerSqm.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}/m²
                                </Text>
                            </View>
                        </View>

                        <View style={styles.marketDifferenceRow}>
                            <Text style={styles.marketDifferenceLabel}>Fark</Text>
                            <Text style={[
                                styles.marketDifferenceValue,
                                results.marketComparison.isBelowMarket ? { color: '#10b981' } : { color: '#ef4444' }
                            ]}>
                                {results.marketComparison.isBelowMarket ? '' : '+'}
                                {results.marketComparison.differencePercent.toFixed(1)}%
                            </Text>
                        </View>
                    </View>
                )}

                {/* Donut Chart Card - Dinamik */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Gider Dağılımı</Text>
                        <Text style={styles.periodBadgeInline}>Yıllık</Text>
                    </View>
                    <View style={styles.chartContainer}>
                        <Svg width={200} height={200} viewBox="0 0 100 100">
                            {/* Background Circle */}
                            <Circle
                                cx="50" cy="50" r={radius}
                                stroke={Colors.dark.border}
                                strokeWidth="12"
                                fill="transparent"
                            />
                            {/* Dynamic Segments */}
                            <G rotation="-90" origin="50, 50">
                                {donutSegments.map((segment, index) => (
                                    <Circle
                                        key={index}
                                        cx="50" cy="50" r={radius}
                                        stroke={segment.color}
                                        strokeWidth="12"
                                        fill="transparent"
                                        strokeDasharray={segment.strokeDasharray}
                                        strokeDashoffset={segment.strokeDashoffset}
                                        strokeLinecap="round"
                                    />
                                ))}
                            </G>
                        </Svg>
                        <View style={styles.donutLabel}>
                            <Text style={styles.donutLabelTitle}>Toplam</Text>
                            <Text style={styles.donutLabelValue}>
                                {totalAnnualExpense >= 1000000
                                    ? `${(totalAnnualExpense / 1000000).toFixed(1)}M`
                                    : `${(totalAnnualExpense / 1000).toFixed(0)}k`}
                            </Text>
                        </View>
                    </View>

                    {/* Legend */}
                    <View style={styles.expenseDistributionGrid}>
                        {donutSegments.map((segment, index) => (
                            <View key={index} style={styles.expenseItem}>
                                <View style={[styles.dot, { backgroundColor: segment.color }]} />
                                <View>
                                    <Text style={styles.expenseName}>{segment.name}</Text>
                                    <Text style={styles.expensePercent}>{segment.percentage.toFixed(0)}%</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Line Chart Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderCol}>
                        <Text style={styles.cardTitle}>10 Yıllık Değer Projeksiyonu</Text>
                        <Text style={styles.cardSubtitle}>
                            Yıllık %{appreciationRate} değer artışı varsayımıyla
                        </Text>
                    </View>

                    <LineChart
                        data={{
                            labels: projectionLabels,
                            datasets: [{ data: projectionData }]
                        }}
                        width={screenWidth - 64}
                        height={200}
                        withDots={false}
                        withInnerLines={true}
                        withOuterLines={false}
                        withVerticalLines={false}
                        withHorizontalLabels={false}
                        chartConfig={{
                            backgroundColor: Colors.dark.surface,
                            backgroundGradientFrom: Colors.dark.surface,
                            backgroundGradientTo: Colors.dark.surface,
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(79, 133, 246, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                            style: {
                                borderRadius: 16
                            },
                            propsForBackgroundLines: {
                                strokeDasharray: "",
                                stroke: Colors.dark.border
                            }
                        }}
                        bezier
                        style={{
                            marginVertical: 8,
                            borderRadius: 16
                        }}
                    />
                    {/* Tooltip with final value */}
                    <View style={styles.chartTooltip}>
                        <Text style={styles.chartTooltipText}>
                            ₺{projectionData[projectionData.length - 1] >= 1000000000
                                ? `${(projectionData[projectionData.length - 1] / 1000000000).toFixed(1)}B`
                                : projectionData[projectionData.length - 1] >= 1000000
                                    ? `${(projectionData[projectionData.length - 1] / 1000000).toFixed(1)}M`
                                    : (projectionData[projectionData.length - 1] / 1000).toFixed(0) + 'k'}
                        </Text>
                        <View style={styles.chartTooltipArrow} />
                    </View>
                </View>

                {/* Bottom Spacer */}
                <View style={{ height: 40 }} />

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.dark.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: Colors.dark.background,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },

    // Property Header
    propertyHeader: {
        paddingBottom: 16,
        marginBottom: 8,
    },
    propertyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    propertyLocation: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 8,
    },
    propertyPrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.primary,
    },

    // Sticky Bar
    stickyBar: {
        backgroundColor: Colors.dark.background,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
        zIndex: 10,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    balanceLabel: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '500',
    },
    balanceValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    balanceValueText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    pdfButton: {
        backgroundColor: Colors.dark.primary,
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    pdfButtonDisabled: {
        opacity: 0.7,
    },
    pdfButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    costBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 2,
    },
    costText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
    },

    // Content
    content: {
        padding: 16,
        gap: 20,
    },
    card: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 8,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#94a3b8',
    },
    overviewGrid: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 16,
    },
    overviewItem: {
        flex: 1,
    },
    overviewLabel: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 4,
    },
    overviewValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginTop: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    trendBadgeGood: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    trendBadgeBad: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    trendText: {
        fontSize: 12,
        fontWeight: '600',
    },

    // Net Income
    netIncomeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.dark.background,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    netIncomeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    netIncomeSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
    },
    netIncomeValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#10b981',
    },
    netIncomeNegative: {
        color: '#ef4444',
    },

    // Loan Details
    loanBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    loanBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#f59e0b',
    },
    loanDetailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    loanDetailItem: {
        width: '47%',
        backgroundColor: Colors.dark.background,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    loanDetailLabel: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 4,
    },
    loanDetailValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    loanSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(79, 133, 246, 0.1)',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(79, 133, 246, 0.2)',
    },
    loanSummaryLabel: {
        fontSize: 12,
        color: '#94a3b8',
    },
    loanSummaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.primary,
    },

    // Market Comparison
    marketBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    marketBadgeGood: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    marketBadgeBad: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    marketBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    marketComparisonGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    marketComparisonItem: {
        flex: 1,
        alignItems: 'center',
    },
    marketComparisonDivider: {
        paddingHorizontal: 16,
    },
    marketLabel: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 4,
    },
    marketValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    marketDifferenceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.dark.background,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    marketDifferenceLabel: {
        fontSize: 14,
        color: '#94a3b8',
    },
    marketDifferenceValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },

    divider: {
        height: 1,
        backgroundColor: Colors.dark.border,
        marginVertical: 16,
    },
    expenseSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    expenseTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#cbd5e1',
    },
    periodBadge: {
        fontSize: 12,
        fontWeight: '500',
        color: '#cbd5e1',
        backgroundColor: Colors.dark.background,
    },
    totalExpense: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    expenseDistributionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginTop: 16,
    },
    expenseItem: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        width: '45%',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    expenseName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#cbd5e1',
    },
    expensePercent: {
        fontSize: 12,
        color: '#94a3b8',
    },

    // Donut
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    periodBadgeInline: {
        fontSize: 12,
        fontWeight: '500',
        color: '#cbd5e1',
        backgroundColor: Colors.dark.background,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    donutLabel: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    donutLabelTitle: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    },
    donutLabelValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },

    // Line Chart
    cardHeaderCol: {
        marginBottom: 16,
    },
    chartTooltip: {
        position: 'absolute',
        top: 60,
        right: 10,
        backgroundColor: Colors.dark.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    chartTooltipText: {
        color: Colors.dark.text,
        fontSize: 12,
        fontWeight: 'bold',
    },
    chartTooltipArrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderTopWidth: 5,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: Colors.dark.background,
        position: 'absolute',
        bottom: -5,
    },

    // Warning Card Styles
    warningCard: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 4,
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    warningTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f59e0b',
    },
    warningText: {
        fontSize: 14,
        color: '#cbd5e1',
        lineHeight: 20,
        marginBottom: 12,
    },
    warningHighlight: {
        fontWeight: 'bold',
        color: '#ef4444',
    },
    warningDetails: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    warningRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    warningRowTotal: {
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
        marginTop: 6,
        paddingTop: 10,
    },
    warningLabel: {
        fontSize: 13,
        color: '#94a3b8',
    },
    warningLabelBold: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    warningValuePositive: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#10b981',
    },
    warningValueNegative: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    warningFooter: {
        fontSize: 12,
        color: '#94a3b8',
        fontStyle: 'italic',
        lineHeight: 18,
    },
});
