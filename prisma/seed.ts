import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const data = [
  // SALUD
  { mainArea: "Salud", subArea: "HOGAR GRANJA", cardNumber: "70841431000162811" },
  { mainArea: "Salud", subArea: "POLICLÍNICO", cardNumber: "70841431000159932" },
  { mainArea: "Salud", subArea: "BROMATOLOGÍA", cardNumber: "70841431000162837" },
  { mainArea: "Salud", subArea: "HOSPITAL", cardNumber: "70841431000163009" },
  { mainArea: "Salud", subArea: "SAME", cardNumber: "70841431000163033" },
  { mainArea: "Salud", subArea: "HOSPITAL", cardNumber: "70841431000163074" },
  { mainArea: "Salud", subArea: "HOSPITAL", cardNumber: "70841431000163090" },
  { mainArea: "Salud", subArea: "HOGAR GRANJA", cardNumber: "70841431000351422" },
  { mainArea: "Salud", subArea: "SAME", cardNumber: "70841431000351448" },
  { mainArea: "Salud", subArea: "HOSPITAL", cardNumber: "70841431000163066" },
  { mainArea: "Salud", subArea: "SALUD", cardNumber: "70841431000178288" },
  { mainArea: "Salud", subArea: "HOSPITAL", cardNumber: "70841431000291362" },
  { mainArea: "Salud", subArea: "POLICLÍNICO", cardNumber: "70841431003130740" },
  { mainArea: "Salud", subArea: "HOSPITAL", cardNumber: "70841431004276476" },

  // PROTECCIÓN CIUDADANA
  { mainArea: "Protección Ciudadana", subArea: "COMISARIA OPEN DOOR", cardNumber: "70841431000163355" },
  { mainArea: "Protección Ciudadana", subArea: "COM", cardNumber: "70841431000164171" },
  { mainArea: "Protección Ciudadana", subArea: "COM", cardNumber: "70841431000164312" },
  { mainArea: "Protección Ciudadana", subArea: "TRÁNSITO", cardNumber: "70841431000164395" },
  { mainArea: "Protección Ciudadana", subArea: "CONTROL URBANO", cardNumber: "70841431000164833" },
  { mainArea: "Protección Ciudadana", subArea: "INTELIGENCIA", cardNumber: "70841431000164874" },
  { mainArea: "Protección Ciudadana", subArea: "DDI", cardNumber: "70841431000164890" },
  { mainArea: "Protección Ciudadana", subArea: "SECRETARÍA", cardNumber: "70841431001043663" },
  { mainArea: "Protección Ciudadana", subArea: "DDI", cardNumber: "70841431000164908" },
  { mainArea: "Protección Ciudadana", subArea: "DDI", cardNumber: "70841431000164916" },
  { mainArea: "Protección Ciudadana", subArea: "DDI", cardNumber: "70841431000164924" },
  { mainArea: "Protección Ciudadana", subArea: "DDI", cardNumber: "70841431000164932" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA VIAL", cardNumber: "70841431000165079" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA VIAL", cardNumber: "70841431000165087" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA BOMBEROS", cardNumber: "70841431000165095" },
  { mainArea: "Protección Ciudadana", subArea: "DROGAS", cardNumber: "70841431000165103" },
  { mainArea: "Protección Ciudadana", subArea: "COMISARÍA 2DA JAUREGUI", cardNumber: "70841431000165152" },
  { mainArea: "Protección Ciudadana", subArea: "COMISARÍA 2DA JAUREGUI", cardNumber: "70841431000165178" },
  { mainArea: "Protección Ciudadana", subArea: "COMISARÍA 1RA", cardNumber: "70841431000165210" },
  { mainArea: "Protección Ciudadana", subArea: "DROGAS", cardNumber: "70841431000255086" },
  { mainArea: "Protección Ciudadana", subArea: "DDI", cardNumber: "70841431000257090" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431000298409" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA CIENTÍFICA", cardNumber: "70841431000363062" },
  { mainArea: "Protección Ciudadana", subArea: "COMANDO PATRULLA", cardNumber: "70841431000556731" },
  { mainArea: "Protección Ciudadana", subArea: "EXPLOSIVOS", cardNumber: "70841431000594013" },
  { mainArea: "Protección Ciudadana", subArea: "DROGAS", cardNumber: "70841431000630981" },
  { mainArea: "Protección Ciudadana", subArea: "COMANDO PATRULLA", cardNumber: "70841431000699044" },
  { mainArea: "Protección Ciudadana", subArea: "COMANDO PATRULLA", cardNumber: "70841431000699051" },
  { mainArea: "Protección Ciudadana", subArea: "COMISARÍA OPEN DOOR", cardNumber: "70841431000699069" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431000699077" },
  { mainArea: "Protección Ciudadana", subArea: "COMANDO PATRULLA", cardNumber: "70841431000699085" },
  { mainArea: "Protección Ciudadana", subArea: "COMANDO PATRULLA", cardNumber: "70841431000699093" },
  { mainArea: "Protección Ciudadana", subArea: "DESTACAMENTO TORRES", cardNumber: "70841431000699101" },
  { mainArea: "Protección Ciudadana", subArea: "COMANDO PATRULLA", cardNumber: "70841431000699119" },
  { mainArea: "Protección Ciudadana", subArea: "COMANDO PATRULLA", cardNumber: "70841431000699127" },
  { mainArea: "Protección Ciudadana", subArea: "COMISARÍA 2DA JAUREGUI", cardNumber: "70841431000699143" },
  { mainArea: "Protección Ciudadana", subArea: "CONTROL URBANO", cardNumber: "70841431000946262" },
  { mainArea: "Protección Ciudadana", subArea: "COMANDO PATRULLA", cardNumber: "70841431001072480" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431001103756" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431001103806" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431001103822" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431001103848" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431001103871" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431001103897" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431001103905" },
  { mainArea: "Protección Ciudadana", subArea: "PROTECCION", cardNumber: "70841431000164411" },
  { mainArea: "Protección Ciudadana", subArea: "PROTECCION", cardNumber: "70841431000164858" },
  { mainArea: "Protección Ciudadana", subArea: "SEÑALIZACIÓN", cardNumber: "70841431000291271" },
  { mainArea: "Protección Ciudadana", subArea: "PROTECCION", cardNumber: "70841431000164163" },
  { mainArea: "Protección Ciudadana", subArea: "SUPERINTENDENCIA", cardNumber: "70841431001744385" },
  { mainArea: "Protección Ciudadana", subArea: "SUPERINTENDENCIA", cardNumber: "70841431001744427" },
  { mainArea: "Protección Ciudadana", subArea: "SUPERINTENDENCIA", cardNumber: "70841431001744435" },
  { mainArea: "Protección Ciudadana", subArea: "COM", cardNumber: "70841431000160062" },
  { mainArea: "Protección Ciudadana", subArea: "COM", cardNumber: "70841431000164189" },
  { mainArea: "Protección Ciudadana", subArea: "TRÁNSITO", cardNumber: "70841431000164197" },
  { mainArea: "Protección Ciudadana", subArea: "COMISARÍA 1RA", cardNumber: "70841431001744567" },
  { mainArea: "Protección Ciudadana", subArea: "RURAL", cardNumber: "70841431001744500" },
  { mainArea: "Protección Ciudadana", subArea: "RURAL", cardNumber: "70841431001744526" },
  { mainArea: "Protección Ciudadana", subArea: "RURAL", cardNumber: "70841431001744534" },
  { mainArea: "Protección Ciudadana", subArea: "RURAL", cardNumber: "70841431001744542" },
  { mainArea: "Protección Ciudadana", subArea: "RURAL", cardNumber: "70841431001744559" },
  { mainArea: "Protección Ciudadana", subArea: "COMANDO PATRULLA", cardNumber: "70841431000556723" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431001754319" },
  { mainArea: "Protección Ciudadana", subArea: "COMANDO PATRULLA", cardNumber: "70841431001103780" },
  { mainArea: "Protección Ciudadana", subArea: "TRÁNSITO", cardNumber: "70841431000164338" },
  { mainArea: "Protección Ciudadana", subArea: "SECRETARIA", cardNumber: "70841431000164288" },
  { mainArea: "Protección Ciudadana", subArea: "COMANDO PATRULLA", cardNumber: "70841431001103772" },
  { mainArea: "Protección Ciudadana", subArea: "COMANDO PATRULLA", cardNumber: "70841431001103723" },
  { mainArea: "Protección Ciudadana", subArea: "COMANDO PATRULLA", cardNumber: "70841431000653975" },
  { mainArea: "Protección Ciudadana", subArea: "SECRETARÍA", cardNumber: "70841431000164320" },
  { mainArea: "Protección Ciudadana", subArea: "TRÁNSITO", cardNumber: "70841431000164387" },
  { mainArea: "Protección Ciudadana", subArea: "SECRETARÍA", cardNumber: "70841431000737695" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431001965238" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431001965378" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431001965360" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431001965261" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431001965402" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431001965386" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431001965410" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431001965436" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431001965394" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431001935900" },
  { mainArea: "Protección Ciudadana", subArea: "COMISARIA DE LA MUJER", cardNumber: "70841431002113630" },
  { mainArea: "Protección Ciudadana", subArea: "COMANDO PATRULLA", cardNumber: "70841431002113663" },
  { mainArea: "Protección Ciudadana", subArea: "PROTECCION CIUDADANA", cardNumber: "70841431001965345" },
  { mainArea: "Protección Ciudadana", subArea: "PROTECCION CIUDADANA", cardNumber: "70841431000166945" },
  { mainArea: "Protección Ciudadana", subArea: "PROTECCION CIUDADANA", cardNumber: "70841431001857716" },
  { mainArea: "Protección Ciudadana", subArea: "TRANSITO", cardNumber: "70841431002266487" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431002531971" },
  { mainArea: "Protección Ciudadana", subArea: "PROTECCION CIUDADANA", cardNumber: "70841431002444431" },
  { mainArea: "Protección Ciudadana", subArea: "SECRETARIA", cardNumber: "70841431002497546" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431002587684" },
  { mainArea: "Protección Ciudadana", subArea: "MORGUERA", cardNumber: "70841431003194498" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003194365" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003194332" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003194290" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003194464" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003194407" },
  { mainArea: "Protección Ciudadana", subArea: "TRÁNSITO", cardNumber: "70841431003451757" },
  { mainArea: "Protección Ciudadana", subArea: "SECRETARIA", cardNumber: "70841431002572314" },
  { mainArea: "Protección Ciudadana", subArea: "DESTACAMENTO BRAHAMA", cardNumber: "70841431003517649" },
  { mainArea: "Protección Ciudadana", subArea: "PROTECCIÓN CIUDADANA", cardNumber: "70841431003517706" },
  { mainArea: "Protección Ciudadana", subArea: "PROTECCIÓN CIUDADANA", cardNumber: "70841431003517714" },
  { mainArea: "Protección Ciudadana", subArea: "PROTECCIÓN CIUDADANA", cardNumber: "70841431003517672" },
  { mainArea: "Protección Ciudadana", subArea: "COMANDO DE PATRULLAS", cardNumber: "70841431003517680" },
  { mainArea: "Protección Ciudadana", subArea: "PROTECCIÓN CIUDADANA", cardNumber: "70841431003517664" },
  { mainArea: "Protección Ciudadana", subArea: "PROTECCIÓN CIUDADANA", cardNumber: "70841431003517599" },
  { mainArea: "Protección Ciudadana", subArea: "DESTACAMENTO ESTACIÓN", cardNumber: "70841431003517698" },
  { mainArea: "Protección Ciudadana", subArea: "COMISARIA LUJÁN 1RA", cardNumber: "70841431003517730" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003517581" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003517466" },
  { mainArea: "Protección Ciudadana", subArea: "CRIA 3RA OPEN DOOR", cardNumber: "70841431003516534" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003516583" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003517433" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003516641" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003517441" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003517458" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003516567" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003585265" },
  { mainArea: "Protección Ciudadana", subArea: "SECRETARÍA", cardNumber: "70841431003584011" },
  { mainArea: "Protección Ciudadana", subArea: "PROTECCIÓN CIUDADANA", cardNumber: "70841431000737687" },
  { mainArea: "Protección Ciudadana", subArea: "TRÁNSITO", cardNumber: "70841431003803395" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003889923" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003798496" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003798397" },
  { mainArea: "Protección Ciudadana", subArea: "TRÁNSITO", cardNumber: "70841431003970590" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003889907" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003798439" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003798330" },
  { mainArea: "Protección Ciudadana", subArea: "GUARDIA URBANA", cardNumber: "70841431003889931" },
  { mainArea: "Protección Ciudadana", subArea: "PROTECCIÓN", cardNumber: "70841431004003086" },
  { mainArea: "Protección Ciudadana", subArea: "TRÁNSITO", cardNumber: "70841431003970632" },
  { mainArea: "Protección Ciudadana", subArea: "TRÁNSITO", cardNumber: "70841431004272269" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431004231414" },
  { mainArea: "Protección Ciudadana", subArea: "POLICIA LOCAL", cardNumber: "70841431004321413" },

  // INTENDENCIA
  { mainArea: "Intendencia", subArea: "CEREMONIAL", cardNumber: "70841431002234543" },
  { mainArea: "Intendencia", subArea: "PRIVADA", cardNumber: "70841431000159049" },
  { mainArea: "Intendencia", subArea: "JUZGADO DE FALTAS", cardNumber: "70841431000166929" },
  { mainArea: "Intendencia", subArea: "PRIVADA", cardNumber: "70841431002881723" },
  { mainArea: "Intendencia", subArea: "PRIVADA", cardNumber: "70841431000159619" },
  { mainArea: "Intendencia", subArea: "PRIVADA", cardNumber: "70841431002234527" },
  { mainArea: "Intendencia", subArea: "PRIVADA", cardNumber: "70841431003268276" },
  { mainArea: "Intendencia", subArea: "PRIVADA", cardNumber: "70841431003798280" },

  // JEFATURA DE GABINETE
  { mainArea: "Jefatura de Gabinete", subArea: "INSPECCIÓN TRÁNSITO", cardNumber: "70841431000159817" },
  { mainArea: "Jefatura de Gabinete", subArea: "DEFENSA CIVIL", cardNumber: "70841431000173818" },
  { mainArea: "Jefatura de Gabinete", subArea: "INSPECCIÓN GENERAL", cardNumber: "70841431000222839" },
  { mainArea: "Jefatura de Gabinete", subArea: "DEFENSA CIVIL", cardNumber: "70841431000198385" },
  { mainArea: "Jefatura de Gabinete", subArea: "DEFENSA CIVIL", cardNumber: "70841431001950594" },
  { mainArea: "Jefatura de Gabinete", subArea: "COMUNICACIONES", cardNumber: "70841431003723619" },
  { mainArea: "Jefatura de Gabinete", subArea: "INSPECCIÓN GENERAL", cardNumber: "70841431001072498" },

  // OBRAS PÚBLICAS
  { mainArea: "Obras Públicas", subArea: "OBRAS PÚBLICAS", cardNumber: "70841431003797977" },
  { mainArea: "Obras Públicas", subArea: "OBRAS PÚBLICAS", cardNumber: "70841431000164197" },

  // DESARROLLO HUMANO
  { mainArea: "Desarrollo Humano", subArea: "SECRETARÍA", cardNumber: "70841431000160104" },
  { mainArea: "Desarrollo Humano", subArea: "DISCAPACIDAD", cardNumber: "70841431000232028" },
  { mainArea: "Desarrollo Humano", subArea: "DEPORTES", cardNumber: "70841431002425208" },
  { mainArea: "Desarrollo Humano", subArea: "ABORDAJE", cardNumber: "70841431001676629" },
  { mainArea: "Desarrollo Humano", subArea: "SECRETARIA", cardNumber: "70841431001244527" },
  { mainArea: "Desarrollo Humano", subArea: "NIÑEZ", cardNumber: "70841431000160146" },
  { mainArea: "Desarrollo Humano", subArea: "CASA DE LA JUVENTUD", cardNumber: "70841431000363070" },
  { mainArea: "Desarrollo Humano", subArea: "ABORDAJE", cardNumber: "70841431002279688" },
  { mainArea: "Desarrollo Humano", subArea: "DEPORTES BAJA", cardNumber: "70841431000291404" },
  { mainArea: "Desarrollo Humano", subArea: "CAMION IVECO", cardNumber: "70841431000225840" },
  { mainArea: "Desarrollo Humano", subArea: "DISCAPACIDAD", cardNumber: "70841431000163025" },
  { mainArea: "Desarrollo Humano", subArea: "SECRETARÍA", cardNumber: "70841431003797928" },
  { mainArea: "Desarrollo Humano", subArea: "ABORDAJE", cardNumber: "70841431004036466" },

  // DESARROLLO PRODUCTIVO
  { mainArea: "Desarrollo Productivo", subArea: "DESARROLLO PRODUCTIVO", cardNumber: "70841431002246943" },
  { mainArea: "Desarrollo Productivo", subArea: "DESARROLLO PRODUCTIVO", cardNumber: "70841431002201021" },
  { mainArea: "Desarrollo Productivo", subArea: "MEDIO AMBIENTE", cardNumber: "70841431000351430" },
  { mainArea: "Desarrollo Productivo", subArea: "PRODUCCIÓN", cardNumber: "70841431000160153" },
  { mainArea: "Desarrollo Productivo", subArea: "PRODUCCIÓN", cardNumber: "70841431003766816" },
  { mainArea: "Desarrollo Productivo", subArea: "PRODUCCIÓN", cardNumber: "70841431003875765" },

  // ECONOMÍA
  { mainArea: "Economía", subArea: "FORD FOCUS", cardNumber: "70841431002246141" },
  { mainArea: "Economía", subArea: "PATRIMONIO", cardNumber: "70841431001043689" },

  // GOBIERNO
  { mainArea: "Gobierno", subArea: "DELEGACIÓN TORRES", cardNumber: "70841431002714411" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN JAUREGUI", cardNumber: "70841431000171994" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN OPEN DOOR", cardNumber: "70841431000187966" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN OPEN DOOR", cardNumber: "70841431000199490" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN OLIVERA", cardNumber: "70841431000199516" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN TORRES", cardNumber: "70841431000199524" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN TORRES", cardNumber: "70841431000199540" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN PUEBLO NUEVO", cardNumber: "70841431000291289" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN TORRES", cardNumber: "70841431000291297" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN CARLOS KEEN", cardNumber: "70841431000291339" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN OLIVERA", cardNumber: "70841431000291370" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN PUEBLO NUEVO", cardNumber: "70841431001576381" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN OPEN DOOR", cardNumber: "70841431000291313" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN PUEBLO NUEVO", cardNumber: "70841431000199557" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN PUEBLO NUEVO", cardNumber: "70841431000198401" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN PUEBLO NUEVO", cardNumber: "70841431000199573" },
  { mainArea: "Gobierno", subArea: "SECRETARIA", cardNumber: "70841431001744575" },
  { mainArea: "Gobierno", subArea: "DELEGACIONES", cardNumber: "70841431000587637" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN CORTINEZ", cardNumber: "70841431001884322" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN CARLOS KEEN", cardNumber: "70841431002234535" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN TORRES", cardNumber: "70841431002575978" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN OLIVERA", cardNumber: "70841431003723601" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN PUEBLO NUEVO", cardNumber: "70841431003840561" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN PUEBLO NUEVO", cardNumber: "70841431003840546" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN JAUREGUI", cardNumber: "70841431003840587" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN OLIVERA", cardNumber: "70841431004063700" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN OLIVERA", cardNumber: "70841431004063767" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN OLIVERA", cardNumber: "70841431004169937" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN JAUREGUI", cardNumber: "70841431004321405" },
  { mainArea: "Gobierno", subArea: "DELEGACIÓN PUEBLO NUEVO", cardNumber: "70841431004321389" },

  // SERVICIOS PÚBLICOS
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000160161" },
  { mainArea: "Servicios Públicos", subArea: "OBRAS PÚBLICAS", cardNumber: "70841431000170590" },
  { mainArea: "Servicios Públicos", subArea: "SERVICIOS SANITARIOS", cardNumber: "70841431000170624" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000171226" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000171267" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000171846" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000171853" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000171879" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000172141" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431002881756" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000172315" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000172323" },
  { mainArea: "Servicios Públicos", subArea: "SERVICIOS SANITARIOS", cardNumber: "70841431000176035" },
  { mainArea: "Servicios Públicos", subArea: "SERVICIOS SANITARIOS", cardNumber: "70841431000176050" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000200371" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000228109" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000228299" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000280894" },
  { mainArea: "Servicios Públicos", subArea: "ESPACIOS VERDES", cardNumber: "70841431001859670" },
  { mainArea: "Servicios Públicos", subArea: "SERVICIOS SANITARIOS", cardNumber: "70841431000363047" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431001259194" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000171085" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000171242" },
  { mainArea: "Servicios Públicos", subArea: "SERVICIOS SANITARIOS", cardNumber: "70841431000556715" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000200488" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431001696072" },
  { mainArea: "Servicios Públicos", subArea: "SERVICIOS SANITARIOS", cardNumber: "70841431001372252" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000200397" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000175987" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000436702" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431002166729" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431002213877" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431002166737" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431001814618" },
  { mainArea: "Servicios Públicos", subArea: "E. VERDE DE BAJA", cardNumber: "70841431000280910" },
  { mainArea: "Servicios Públicos", subArea: "SECRETARIA", cardNumber: "70841431000151889" },
  { mainArea: "Servicios Públicos", subArea: "SECRETARIA", cardNumber: "70841431000151897" },
  { mainArea: "Servicios Públicos", subArea: "ESPACIOS VERDES", cardNumber: "70841431002564063" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431002416348" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431002298084" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431002564071" },
  { mainArea: "Servicios Públicos", subArea: "SERVICIOS SANITARIOS", cardNumber: "70841431002592080" },
  { mainArea: "Servicios Públicos", subArea: "RESIDUOS SÓLIDOS", cardNumber: "70841431002250697" },
  { mainArea: "Servicios Públicos", subArea: "BASURAL", cardNumber: "70841431000176084" },
  { mainArea: "Servicios Públicos", subArea: "SERVICIOS SANITARIOS", cardNumber: "70841431000253263" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431000172273" },
  { mainArea: "Servicios Públicos", subArea: "RESIDUOS SÓLIDOS", cardNumber: "70841431003942631" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431003977413" },
  { mainArea: "Servicios Públicos", subArea: "TALLER 1", cardNumber: "70841431004208974" }
]

async function main() {
  console.log('🌱 Starting database seeding...')
  
  try {
    // Find or create default user
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'admin@municipalidad.gov',
          name: 'Administrador Municipal'
        }
      })
      console.log('✅ Created default user')
    }

    // Get unique main areas
    const uniqueMainAreas = new Set(data.map(item => item.mainArea))
    
    // Create main areas
    for (const mainAreaName of Array.from(uniqueMainAreas)) {
      await prisma.mainArea.upsert({
        where: { name: mainAreaName },
        update: { name: mainAreaName },
        create: { name: mainAreaName }
      })
    }
    console.log(`✅ Created ${uniqueMainAreas.size} main areas`)

    // Get all main areas with their IDs
    const mainAreas = await prisma.mainArea.findMany()
    const mainAreaMap = new Map(mainAreas.map(area => [area.name, area]))

    // Get unique sub areas with their main areas
    const uniqueSubAreas = new Set(data.map(item => `${item.mainArea}|${item.subArea}`))
    
    // Create sub areas
    for (const subAreaKey of Array.from(uniqueSubAreas)) {
      const [mainAreaName, subAreaName] = subAreaKey.split('|')
      const mainArea = mainAreaMap.get(mainAreaName)
      
      if (mainArea) {
        await prisma.subArea.upsert({
          where: { 
            name_parentAreaId: {
              name: subAreaName,
              parentAreaId: mainArea.id
            }
          },
          update: { 
            name: subAreaName,
            parentAreaId: mainArea.id
          },
          create: {
            name: subAreaName,
            parentAreaId: mainArea.id
          }
        })
      }
    }
    console.log(`✅ Created ${uniqueSubAreas.size} sub areas`)

    // Get all sub areas with their IDs
    const subAreas = await prisma.subArea.findMany()
    const subAreaMap = new Map()
    
    // Create a better lookup for sub areas
    for (const subArea of subAreas) {
      const mainArea = mainAreas.find(ma => ma.id === subArea.parentAreaId)
      if (mainArea) {
        const key = `${mainArea.name}|${subArea.name}`
        subAreaMap.set(key, subArea)
      }
    }

    // Create cards
    for (const cardData of data) {
      const subAreaKey = `${cardData.mainArea}|${cardData.subArea}`
      const subArea = subAreaMap.get(subAreaKey)
      
      if (subArea) {
        await prisma.card.upsert({
          where: { cardNumber: cardData.cardNumber },
          update: {
            identification: cardData.subArea, // Use subArea name as identification
            areaId: subArea.parentAreaId, // Use parentAreaId (which is the main area ID)
            subAreaId: subArea.id,
            userId: user.id
          },
          create: {
            cardNumber: cardData.cardNumber,
            identification: cardData.subArea, // Use subArea name as identification
            areaId: subArea.parentAreaId, // Use parentAreaId (which is the main area ID)
            subAreaId: subArea.id,
            userId: user.id
          }
        })
      }
    }
    
    console.log(`✅ Created ${data.length} cards`)
    console.log('🎉 Database seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
