export const phoneMask = (val: string) => {
  if (!val) return ''
  let v = val.replace(/\D/g, '')
  if (v.length > 11) v = v.slice(0, 11)
  
  if (v.length === 0) return ''
  if (v.length <= 2) return `(${v}`
  if (v.length <= 6) return `(${v.slice(0,2)}) ${v.slice(2)}`
  if (v.length <= 10) return `(${v.slice(0,2)}) ${v.slice(2,6)}-${v.slice(6)}`
  
  return `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`
}

export const getWhatsAppLink = (phone: string) => {
  if (!phone) return '#'
  const numeric = phone.replace(/\D/g, '')
  if (numeric.length >= 10) {
    return `https://wa.me/55${numeric}`
  }
  return '#'
}

export const timeMask = (val: string) => {
  if (!val) return ''
  let v = val.replace(/\D/g, '')
  if (v.length > 4) v = v.slice(0, 4)
  
  if (v.length === 0) return ''
  
  let mm = v.slice(0, 2)
  let ss = v.slice(2, 4)
  
  // Limita até 59
  if (mm.length === 2 && parseInt(mm) > 59) mm = '59'
  if (ss.length === 2 && parseInt(ss) > 59) ss = '59'
  
  if (v.length <= 2) return mm
  return `${mm}:${ss}`
}
