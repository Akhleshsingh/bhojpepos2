/**
 * Lightweight i18n system for 10 Indian languages
 * Usage: t('pay') → 'Pay Now' | 'भुगतान करें'
 */

export const TRANSLATIONS = {
  en: {
    dineIn: 'Dine In', pickup: 'Pickup', delivery: 'Delivery',
    search: 'Search items…', pay: 'Pay Now', hold: 'Hold',
    cartEmpty: 'Cart is empty', addItem: 'Add items from menu',
    subtotal: 'Subtotal', tax: 'Tax', total: 'Total', discount: 'Discount',
    cash: 'Cash', upi: 'UPI', card: 'Card',
    newOrder: 'New Order', note: 'Note', customer: 'Customer',
    waiter: 'Waiter', table: 'Table', guests: 'Guests', rider: 'Rider',
    available: 'Available', occupied: 'Occupied', reserved: 'Reserved',
    orderPlaced: 'Order placed!', paymentDone: 'Payment successful!',
  },
  hi: {
    dineIn: 'यहाँ खाएं', pickup: 'पिकअप', delivery: 'डिलीवरी',
    search: 'आइटम खोजें…', pay: 'भुगतान करें', hold: 'होल्ड',
    cartEmpty: 'कार्ट खाली है', addItem: 'आइटम जोड़ें',
    subtotal: 'उप-कुल', tax: 'कर', total: 'कुल', discount: 'छूट',
    cash: 'नकद', upi: 'यूपीआई', card: 'कार्ड',
    newOrder: 'नया ऑर्डर', note: 'नोट', customer: 'ग्राहक',
    waiter: 'वेटर', table: 'टेबल', guests: 'लोग', rider: 'राइडर',
    available: 'उपलब्ध', occupied: 'व्यस्त', reserved: 'आरक्षित',
    orderPlaced: 'ऑर्डर दिया!', paymentDone: 'भुगतान सफल!',
  },
  mr: {
    dineIn: 'इथे जेवा', pickup: 'पिकअप', delivery: 'डिलिव्हरी',
    search: 'आयटम शोधा…', pay: 'पेमेंट करा', hold: 'थांबवा',
    cartEmpty: 'कार्ट रिकामी', addItem: 'आयटम जोडा',
    subtotal: 'उप-एकूण', tax: 'कर', total: 'एकूण', discount: 'सूट',
    cash: 'रोख', upi: 'यूपीआय', card: 'कार्ड',
    newOrder: 'नवीन ऑर्डर', note: 'नोट', customer: 'ग्राहक',
    waiter: 'वेटर', table: 'टेबल', guests: 'लोक', rider: 'रायडर',
    available: 'उपलब्ध', occupied: 'व्यस्त', reserved: 'राखीव',
    orderPlaced: 'ऑर्डर दिला!', paymentDone: 'पेमेंट यशस्वी!',
  },
  gu: {
    dineIn: 'અહીં જમો', pickup: 'પિકઅપ', delivery: 'ડિલિવરી',
    search: 'આઇટમ શોધો…', pay: 'ચૂકવો', hold: 'હોલ્ડ',
    cartEmpty: 'કાર્ટ ખાલી', addItem: 'આઇટમ ઉમેરો',
    subtotal: 'પેટા-કુલ', tax: 'કર', total: 'કુલ', discount: 'ડિસ્કાઉન્ટ',
    cash: 'રોકડ', upi: 'યૂપીઆઈ', card: 'કાર્ડ',
    newOrder: 'નવો ઓર્ડર', note: 'નોટ', customer: 'ગ્રાહક',
    waiter: 'વેઇટર', table: 'ટેબલ', guests: 'લોકો', rider: 'રાઇડર',
    available: 'ઉપલબ્ધ', occupied: 'ભરેલ', reserved: 'આરક્ષિત',
    orderPlaced: 'ઓર્ડર આપ્યો!', paymentDone: 'ચૂકવણી સફળ!',
  },
  ta: {
    dineIn: 'இங்கே சாப்பிடு', pickup: 'பிக்கப்', delivery: 'டெலிவரி',
    search: 'பொருட்கள் தேடு…', pay: 'பணம் செலுத்து', hold: 'நிறுத்து',
    cartEmpty: 'கார்ட் காலி', addItem: 'பொருட்கள் சேர்',
    subtotal: 'இடைத்தொகை', tax: 'வரி', total: 'மொத்தம்', discount: 'தள்ளுபடி',
    cash: 'பணம்', upi: 'யூபிஐ', card: 'அட்டை',
    newOrder: 'புதிய ஆர்டர்', note: 'குறிப்பு', customer: 'வாடிக்கையாளர்',
    waiter: 'வெய்டர்', table: 'மேசை', guests: 'பேர்', rider: 'ரைடர்',
    available: 'கிடைக்கும்', occupied: 'ஆக்கிரமிக்கப்பட்டது', reserved: 'ஒதுக்கப்பட்டது',
    orderPlaced: 'ஆர்டர் கொடுக்கப்பட்டது!', paymentDone: 'பணம் வெற்றிகரம்!',
  },
  te: {
    dineIn: 'ఇక్కడ తినండి', pickup: 'పికప్', delivery: 'డెలివరీ',
    search: 'వస్తువులు వెతుకు…', pay: 'చెల్లించు', hold: 'హోల్డ్',
    cartEmpty: 'కార్ట్ ఖాళీ', addItem: 'వస్తువులు జోడించు',
    subtotal: 'ఉప మొత్తం', tax: 'పన్ను', total: 'మొత్తం', discount: 'తగ్గింపు',
    cash: 'నగదు', upi: 'UPI', card: 'కార్డ్',
    newOrder: 'కొత్త ఆర్డర్', note: 'నోట్', customer: 'కస్టమర్',
    waiter: 'వెయిటర్', table: 'టేబుల్', guests: 'మంది', rider: 'రైడర్',
    available: 'అందుబాటులో', occupied: 'ఆక్రమించబడింది', reserved: 'రిజర్వ్ చేయబడింది',
    orderPlaced: 'ఆర్డర్ ఇవ్వబడింది!', paymentDone: 'చెల్లింపు విజయవంతం!',
  },
  kn: {
    dineIn: 'ಇಲ್ಲಿ ತಿನ್ನಿ', pickup: 'ಪಿಕಪ್', delivery: 'ಡೆಲಿವರಿ',
    search: 'ಐಟಂ ಹುಡುಕಿ…', pay: 'ಪಾವತಿಸಿ', hold: 'ಹೋಲ್ಡ್',
    cartEmpty: 'ಕಾರ್ಟ್ ಖಾಲಿ', addItem: 'ಐಟಂ ಸೇರಿಸಿ',
    subtotal: 'ಉಪ-ಒಟ್ಟು', tax: 'ತೆರಿಗೆ', total: 'ಒಟ್ಟು', discount: 'ರಿಯಾಯಿತಿ',
    cash: 'ನಗದು', upi: 'ಯುಪಿಐ', card: 'ಕಾರ್ಡ್',
    newOrder: 'ಹೊಸ ಆರ್ಡರ್', note: 'ನೋಟ್', customer: 'ಗ್ರಾಹಕ',
    waiter: 'ವೇಟರ್', table: 'ಟೇಬಲ್', guests: 'ಜನ', rider: 'ರೈಡರ್',
    available: 'ಲಭ್ಯ', occupied: 'ಆಕ್ರಮಿಸಲ್ಪಟ್ಟಿದೆ', reserved: 'ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ',
    orderPlaced: 'ಆರ್ಡರ್ ಕೊಡಲಾಯಿತು!', paymentDone: 'ಪಾವತಿ ಯಶಸ್ವಿ!',
  },
  ml: {
    dineIn: 'ഇവിടെ കഴിക്കൂ', pickup: 'പിക്കപ്പ്', delivery: 'ഡെലിവറി',
    search: 'ഇനങ്ങൾ തിരയുക…', pay: 'അടയ്ക്കുക', hold: 'ഹോൾഡ്',
    cartEmpty: 'കാർട്ട് ശൂന്യം', addItem: 'ഇനം ചേർക്കുക',
    subtotal: 'ഉപ-ആകെ', tax: 'നികുതി', total: 'ആകെ', discount: 'കിഴിവ്',
    cash: 'പണം', upi: 'യുപിഐ', card: 'കാർഡ്',
    newOrder: 'പുതിയ ഓർഡർ', note: 'കുറിപ്പ്', customer: 'ഉപഭോക്താവ്',
    waiter: 'വേറ്റർ', table: 'മേശ', guests: 'ആളുകൾ', rider: 'റൈഡർ',
    available: 'ലഭ്യം', occupied: 'ഉപയോഗത്തിലാണ്', reserved: 'മുൻകൂട്ടി ബുക്ക്',
    orderPlaced: 'ഓർഡർ നൽകി!', paymentDone: 'പേമെന്റ് വിജയകരം!',
  },
  bn: {
    dineIn: 'এখানে খান', pickup: 'পিকআপ', delivery: 'ডেলিভারি',
    search: 'আইটেম খুঁজুন…', pay: 'এখনই পে করুন', hold: 'হোল্ড',
    cartEmpty: 'কার্ট খালি', addItem: 'আইটেম যোগ করুন',
    subtotal: 'উপমোট', tax: 'কর', total: 'মোট', discount: 'ছাড়',
    cash: 'নগদ', upi: 'ইউপিআই', card: 'কার্ড',
    newOrder: 'নতুন অর্ডার', note: 'নোট', customer: 'গ্রাহক',
    waiter: 'ওয়েটার', table: 'টেবিল', guests: 'জন', rider: 'রাইডার',
    available: 'উপলব্ধ', occupied: 'দখল', reserved: 'সংরক্ষিত',
    orderPlaced: 'অর্ডার দেওয়া হয়েছে!', paymentDone: 'পেমেন্ট সফল!',
  },
  pa: {
    dineIn: 'ਇੱਥੇ ਖਾਓ', pickup: 'ਪਿਕਅੱਪ', delivery: 'ਡਿਲੀਵਰੀ',
    search: 'ਆਈਟਮ ਖੋਜੋ…', pay: 'ਭੁਗਤਾਨ ਕਰੋ', hold: 'ਹੋਲਡ',
    cartEmpty: 'ਕਾਰਟ ਖਾਲੀ', addItem: 'ਆਈਟਮ ਜੋੜੋ',
    subtotal: 'ਉਪ-ਕੁੱਲ', tax: 'ਟੈਕਸ', total: 'ਕੁੱਲ', discount: 'ਛੋਟ',
    cash: 'ਨਕਦ', upi: 'ਯੂਪੀਆਈ', card: 'ਕਾਰਡ',
    newOrder: 'ਨਵਾਂ ਆਰਡਰ', note: 'ਨੋਟ', customer: 'ਗਾਹਕ',
    waiter: 'ਵੇਟਰ', table: 'ਮੇਜ਼', guests: 'ਲੋਕ', rider: 'ਰਾਈਡਰ',
    available: 'ਉਪਲਬਧ', occupied: 'ਵਿਅਸਤ', reserved: 'ਰਾਖਵਾਂ',
    orderPlaced: 'ਆਰਡਰ ਦਿੱਤਾ!', paymentDone: 'ਭੁਗਤਾਨ ਸਫਲ!',
  },
}

// Hook-style getter
let _currentLang = localStorage.getItem('bhojpe_lang') || 'en'

export function setCurrentLang(lang) {
  _currentLang = lang
}

export function t(key) {
  const dict = TRANSLATIONS[_currentLang] || TRANSLATIONS.en
  return dict[key] || TRANSLATIONS.en[key] || key
}

export function useTranslations() {
  const lang = _currentLang
  return (key) => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en
    return dict[key] || TRANSLATIONS.en[key] || key
  }
}
