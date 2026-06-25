function formatStr(id: string, value: string) {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

export function generatePixPayload(pixKey: string, amount: number, merchantName: string = 'Coxia', merchantCity: string = 'Brasil', transactionId: string = '***') {
  const payloadFormatIndicator = formatStr('00', '01');
  const pointOfInitiationMethod = amount ? formatStr('01', '12') : '';
  
  const gui = formatStr('00', 'br.gov.bcb.pix');
  const key = formatStr('01', pixKey);
  const merchantAccountInformation = formatStr('26', gui + key);
  
  const merchantCategoryCode = formatStr('52', '0000');
  const transactionCurrency = formatStr('53', '986');
  const transactionAmount = amount ? formatStr('54', amount.toFixed(2)) : '';
  const countryCode = formatStr('58', 'BR');
  const merchantNameFormatted = formatStr('59', merchantName.substring(0, 25));
  const merchantCityFormatted = formatStr('60', merchantCity.substring(0, 15));
  
  const additionalDataFieldTemplate = formatStr('62', formatStr('05', transactionId));
  
  let payload = `${payloadFormatIndicator}${pointOfInitiationMethod}${merchantAccountInformation}${merchantCategoryCode}${transactionCurrency}${transactionAmount}${countryCode}${merchantNameFormatted}${merchantCityFormatted}${additionalDataFieldTemplate}6304`;
  
  // CRC16 CCITT
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  crc &= 0xFFFF;
  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
  
  return payload + crcHex;
}
