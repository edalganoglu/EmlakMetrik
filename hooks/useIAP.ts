import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
    endConnection,
    fetchProducts,
    finishTransaction,
    initConnection,
    Product,
    Purchase,
    purchaseErrorListener,
    purchaseUpdatedListener,
    requestPurchase
} from 'react-native-iap';

// Platforma göre ürün ID'leri (SKU)
const itemSkus: string[] = Platform.select({
    ios: [
        'credits_20',
        'credits_100',
        'credits_500',
    ],
    android: [
        'credits_20',
        'credits_100',
        'credits_500',
    ],
    default: [],
}) || [];

interface UseIAPOptions {
    onPurchaseSuccess?: (creditAmount: number) => void;
    userId?: string;
}

export const useIAP = (options?: UseIAPOptions) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let purchaseUpdateSubscription: any = null;
        let purchaseErrorSubscription: any = null;

        const initIAP = async () => {
            try {
                await initConnection();
                // Android pending flush removed as it was causing import errors
                setConnected(true);

                if (itemSkus.length > 0) {
                    await getProductsSafe();
                }
            } catch (err) {
                console.warn('IAP Init Error:', err);
            }
        };

        initIAP();

        // Satın alma dinleyicileri
        purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: Purchase) => {
            const receipt = (purchase as any).transactionReceipt || (purchase as any).purchaseToken;
            const productId = (purchase as any).productId || (purchase as any).productIdentifier || purchase.productId;

            if (receipt && productId) {
                try {
                    console.log('Purchase successful:', {
                        productId,
                        transactionId: purchase.transactionId,
                        receipt: receipt.substring(0, 50) + '...'
                    });

                    const creditAmount = getCreditAmountFromSku(productId);
                    
                    if (creditAmount > 0 && options?.userId) {
                        await addCreditsToWallet(options.userId, creditAmount, productId, receipt);
                    }

                    await finishTransaction({ purchase, isConsumable: true });

                    if (options?.onPurchaseSuccess) {
                        options.onPurchaseSuccess(creditAmount);
                    } else {
                        alert(`Satın alma başarılı! ${creditAmount} kredi hesabınıza yüklendi.`);
                    }
                } catch (ackErr) {
                    console.error('Purchase processing error:', ackErr);
                    alert('Satın alma işlendi ancak kredi yüklemede hata oluştu. Lütfen destek ekibiyle iletişime geçin.');
                }
            }
        });

        purchaseErrorSubscription = purchaseErrorListener((error) => {
            console.warn('Purchase Error:', error);
            const errorMessage = error.message || error.code || JSON.stringify(error);
            console.error('Purchase Error Details:', {
                code: error.code,
                message: error.message,
                responseCode: (error as any).responseCode,
                error: error
            });
            alert(`Satın alma hatası: ${errorMessage}`);
        });

        return () => {
            if (purchaseUpdateSubscription) {
                purchaseUpdateSubscription.remove();
                purchaseUpdateSubscription = null;
            }
            if (purchaseErrorSubscription) {
                purchaseErrorSubscription.remove();
                purchaseErrorSubscription = null;
            }
            endConnection();
        };
    }, []);

    const getProductsSafe = async () => {
        try {
            const prods = await fetchProducts({ skus: itemSkus });
            if (prods) {
                setProducts(prods as Product[]);
            }
        } catch (e) {
            console.warn("getProductsSafe error", e);
        }
    }

    const fetchProd = async () => {
        if (itemSkus.length === 0) return;
        setLoading(true);
        await getProductsSafe();
        setLoading(false);
    };

    const reqPurchase = async (sku: string) => {
        try {
            if (!connected) {
                alert('Satın alma servisi henüz hazır değil. Lütfen bekleyin...');
                return;
            }

            const product = products.find(p => 
                (p as any).productId === sku || p.id === sku
            );

            if (!product && products.length > 0) {
                console.warn('Product not found in fetched products:', sku);
                console.log('Available products:', products.map(p => (p as any).productId || p.id));
                alert(`Ürün bulunamadı: ${sku}. Lütfen ürünleri yeniden yükleyin.`);
                return;
            }

            if (products.length === 0) {
                console.warn('No products fetched yet, attempting to fetch...');
                try {
                    const fetchedProds = await fetchProducts({ skus: itemSkus });
                    if (fetchedProds && fetchedProds.length > 0) {
                        const productsArray = fetchedProds.filter((p): p is Product => 
                            (p as any).type === 'in-app'
                        ) as Product[];
                        setProducts(productsArray);
                        const productAfterFetch = productsArray.find(p => 
                            (p as any).productId === sku || p.id === sku
                        );
                        if (!productAfterFetch) {
                            console.warn('Product not found after fetch:', sku);
                            console.log('Fetched products:', productsArray.map(p => (p as any).productId || p.id));
                            alert(`Ürün bulunamadı: ${sku}. App Store Connect'te ürünün aktif olduğundan emin olun.`);
                            return;
                        }
                    } else {
                        alert('Ürünler yüklenemedi. App Store Connect\'te ürünlerin "Ready to Submit" durumunda olduğundan ve bir app versiyonu ile submit edildiğinden emin olun.');
                        return;
                    }
                } catch (fetchErr) {
                    console.error('Error fetching products:', fetchErr);
                    alert('Ürünler yüklenirken hata oluştu. Lütfen internet bağlantınızı kontrol edin.');
                    return;
                }
            }

            console.log("Requesting purchase for SKU:", sku);
            console.log("Product found:", product);

            if (Platform.OS === 'ios') {
                await requestPurchase({
                    request: { apple: { sku } },
                    type: 'in-app'
                });
            } else {
                await requestPurchase({
                    request: { google: { skus: [sku] } },
                    type: 'in-app'
                });
            }

        } catch (err: any) {
            console.warn('Request Purchase Error:', err);
            console.error('Error details:', {
                code: err.code,
                message: err.message,
                responseCode: err.responseCode,
                error: err
            });

            if (err.code === 'E_USER_CANCELLED' || err.code === 'user-cancelled') {
                return;
            }

            alert(`Satın alma hatası: ${err.message || err.code || JSON.stringify(err)}`);
        }
    };

    return {
        products,
        connected,
        loading,
        fetchProducts: fetchProd,
        requestPurchase: reqPurchase,
    };
};

const getCreditAmountFromSku = (sku: string): number => {
    if (sku === 'credits_20') return 20;
    if (sku === 'credits_100') return 100;
    if (sku === 'credits_500') return 500;
    return 0;
};

const addCreditsToWallet = async (
    userId: string,
    creditAmount: number,
    productId: string,
    receipt: string
) => {
    try {
        const receiptId = receipt.substring(0, 50);
        const { error } = await supabase.from('wallet_transactions').insert({
            user_id: userId,
            amount: creditAmount,
            type: 'deposit',
            description: `IAP Satın Alım: ${productId} (Receipt: ${receiptId}...)`
        });

        if (error) {
            console.error('Error adding credits to wallet:', error);
            throw error;
        }

        console.log(`Successfully added ${creditAmount} credits to user ${userId}`);
    } catch (err) {
        console.error('Failed to add credits:', err);
        throw err;
    }
};
