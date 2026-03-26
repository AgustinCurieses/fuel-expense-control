import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const data = [
  { cardNumber: '70841431000151889', identification: 'HCZ 183', mainArea: 'Servicios Publicos', subArea: 'SECRETARIA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000151897', identification: 'JCO 818', mainArea: 'Servicios Publicos', subArea: 'SECRETARIA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000159619', identification: '32998183', mainArea: 'Intendencia', subArea: 'PRIVADA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000159817', identification: 'FTZ198', mainArea: 'Jefatura de Gabinete', subArea: 'INSPECCIÓN TRÁNSITO', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000159932', identification: 'FYP929', mainArea: 'Salud', subArea: 'POLICLÍNICO', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000160062', identification: 'AD108HJ', mainArea: 'Proteccion Ciudadana', subArea: 'COM', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000160104', identification: 'KGS262', mainArea: 'Desarrollo Humano', subArea: 'SECRETARÍA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000160146', identification: 'AD810NK', mainArea: 'Desarrollo Humano', subArea: 'NIÑEZ', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000160153', identification: 'GFP605', mainArea: 'Desarrollo Productivo', subArea: 'PRODUCCIÓN', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000160161', identification: 'DPY020', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000162811', identification: 'AB770JJ', mainArea: 'Salud', subArea: 'HOGAR GRANJA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000162837', identification: 'PKN714', mainArea: 'Salud', subArea: 'BROMATOLOGÍA', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000163009', identification: 'AD766YJ', mainArea: 'Salud', subArea: 'HOSPITAL', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000163025', identification: 'AD481MW', mainArea: 'Desarrollo Humano', subArea: 'DISCAPACIDAD', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000163033', identification: 'AD508KD', mainArea: 'Salud', subArea: 'SAME', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000163066', identification: 'PAA321', mainArea: 'Salud', subArea: 'HOSPITAL', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000163074', identification: 'PIW408', mainArea: 'Salud', subArea: 'HOSPITAL', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000163090', identification: 'LXM732', mainArea: 'Salud', subArea: 'HOSPITAL', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000163355', identification: 'AC252CG', mainArea: 'Proteccion Ciudadana', subArea: 'COMISARIA OPEN DOOR', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000164163', identification: 'OHE179', mainArea: 'Proteccion Ciudadana', subArea: 'PROTECCION', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431000164197', identification: 'PBM497', mainArea: 'Obras Publicas', subArea: 'OBRAS PÚBLICAS', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000164288', identification: 'AB095KX', mainArea: 'Proteccion Ciudadana', subArea: 'SECRETARIA', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000164312', identification: 'AB095KY', mainArea: 'Proteccion Ciudadana', subArea: 'COM', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000164320', identification: 'DEW316', mainArea: 'Proteccion Ciudadana', subArea: 'SECRETARÍA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000164387', identification: 'HJW144', mainArea: 'Proteccion Ciudadana', subArea: 'TRÁNSITO', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000164395', identification: 'HJW159', mainArea: 'Proteccion Ciudadana', subArea: 'TRÁNSITO', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000164411', identification: 'HWE405', mainArea: 'Proteccion Ciudadana', subArea: 'PROTECCION', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000164833', identification: 'AB227JN', mainArea: 'Proteccion Ciudadana', subArea: 'CONTROL URBANO', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000164858', identification: 'CMJ407', mainArea: 'Proteccion Ciudadana', subArea: 'PROTECCION', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000164874', identification: 'AA836KR', mainArea: 'Proteccion Ciudadana', subArea: 'INTELIGENCIA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000164890', identification: 'AB020YS', mainArea: 'Proteccion Ciudadana', subArea: 'DDI', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000164908', identification: 'PGL087', mainArea: 'Proteccion Ciudadana', subArea: 'DDI', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000164916', identification: 'PGQ003', mainArea: 'Proteccion Ciudadana', subArea: 'DDI', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000164924', identification: 'PIZ353', mainArea: 'Proteccion Ciudadana', subArea: 'DDI', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000164932', identification: 'OCT781', mainArea: 'Proteccion Ciudadana', subArea: 'DDI', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000165079', identification: 'AA835CO', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA VIAL', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000165087', identification: 'HWO271', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA VIAL', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000165095', identification: 'AA864BN', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA BOMBEROS', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000165103', identification: 'AB043WX', mainArea: 'Proteccion Ciudadana', subArea: 'DROGAS', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431000165152', identification: 'AD076AO', mainArea: 'Proteccion Ciudadana', subArea: 'COMISARÍA 2DA JAUREGUI', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000165178', identification: 'PAV930', mainArea: 'Proteccion Ciudadana', subArea: 'COMISARÍA 2DA JAUREGUI', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000165210', identification: 'AC429OG', mainArea: 'Proteccion Ciudadana', subArea: 'COMISARÍA 1RA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000166929', identification: 'A108APO', mainArea: 'Intendencia', subArea: 'JUZGADO DE FALTAS', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000166945', identification: 'AC027NX', mainArea: 'Proteccion Ciudadana', subArea: 'PROTECCION CIUDADANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000170590', identification: 'WKM757', mainArea: 'Servicios Publicos', subArea: 'OBRAS PÚBLICAS', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000170624', identification: 'IDI777', mainArea: 'Servicios Publicos', subArea: 'SERVICIOS SANITARIOS', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000171085', identification: 'WJA456', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000171226', identification: 'ONE657', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000171242', identification: 'ONV379', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000171267', identification: 'AB038ZS', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000171846', identification: 'MVB403', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000171853', identification: 'MVB404', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000171879', identification: 'MVB405', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000172315', identification: 'AC693QD', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000173818', identification: 'AB095KZ', mainArea: 'Jefatura de Gabinete', subArea: 'DEFENSA CIVIL', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000175987', identification: 'BLR044', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000176035', identification: 'ONE647', mainArea: 'Servicios Publicos', subArea: 'SERVICIOS SANITARIOS', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000176050', identification: 'OPP826', mainArea: 'Servicios Publicos', subArea: 'SERVICIOS SANITARIOS', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000178288', identification: 'AB960IJ', mainArea: 'Salud', subArea: 'SALUD', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000187966', identification: 'aa873nz', mainArea: 'Gobierno', subArea: 'DELEGACIÓN OPEN DOOR', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431000198385', identification: 'AD002XF', mainArea: 'Jefatura de Gabinete', subArea: 'DEFENSA CIVIL', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000199490', identification: 'DFJ05', mainArea: 'Gobierno', subArea: 'DELEGACIÓN OPEN DOOR', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431000199540', identification: 'CQY78', mainArea: 'Gobierno', subArea: 'DELEGACIÓN TORRES', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000199573', identification: 'WSP922', mainArea: 'Gobierno', subArea: 'DELEGACIÓN PUEBLO NUEVO', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000200397', identification: 'MXQ475', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000200488', identification: 'ONE653', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000222839', identification: 'JIU887', mainArea: 'Jefatura de Gabinete', subArea: 'INSPECCIÓN GENERAL', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000228109', identification: 'CGP12', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000228299', identification: 'CZI45', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000232028', identification: 'ac018ib', mainArea: 'Desarrollo Humano', subArea: 'DISCAPACIDAD', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000253263', identification: 'WKF 116', mainArea: 'Servicios Publicos', subArea: 'SERVICIOS SANITARIOS', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000257090', identification: 'OCT812', mainArea: 'Proteccion Ciudadana', subArea: 'DDI', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000291271', identification: 'SEÑALIZACION', mainArea: 'Proteccion Ciudadana', subArea: 'SEÑALIZACIÓN', cardType: 'maquinaria', allowedFuel: 'ambos' },
  { cardNumber: '70841431000291297', identification: 'TORRES', mainArea: 'Gobierno', subArea: 'DELEGACIÓN TORRES', cardType: 'maquinaria', allowedFuel: 'ambos' },
  { cardNumber: '70841431000291313', identification: 'OPEN DOOR', mainArea: 'Gobierno', subArea: 'DELEGACIÓN OPEN DOOR', cardType: 'maquinaria', allowedFuel: 'ambos' },
  { cardNumber: '70841431000291339', identification: 'CARLOS KEEN', mainArea: 'Gobierno', subArea: 'DELEGACIÓN CARLOS KEEN', cardType: 'maquinaria', allowedFuel: 'ambos' },
  { cardNumber: '70841431000291362', identification: 'HOSPITAL', mainArea: 'Salud', subArea: 'HOSPITAL', cardType: 'maquinaria', allowedFuel: 'ambos' },
  { cardNumber: '70841431000298409', identification: 'A037GTX', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000351422', identification: 'HOGAR GRANJA', mainArea: 'Salud', subArea: 'HOGAR GRANJA', cardType: 'maquinaria', allowedFuel: 'ambos' },
  { cardNumber: '70841431000351430', identification: 'MEDIO AMBIENTE', mainArea: 'Desarrollo Productivo', subArea: 'MEDIO AMBIENTE', cardType: 'maquinaria', allowedFuel: 'ambos' },
  { cardNumber: '70841431000363047', identification: 'SANITARIOS', mainArea: 'Servicios Publicos', subArea: 'SERVICIOS SANITARIOS', cardType: 'maquinaria', allowedFuel: 'ambos' },
  { cardNumber: '70841431000363070', identification: 'CASA JUVENTUD', mainArea: 'Desarrollo Humano', subArea: 'CASA DE LA JUVENTUD', cardType: 'maquinaria', allowedFuel: 'ambos' },
  { cardNumber: '70841431000436702', identification: 'WHS682', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000556715', identification: 'AE971MH', mainArea: 'Servicios Publicos', subArea: 'SERVICIOS SANITARIOS', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000556723', identification: 'AE971MB', mainArea: 'Proteccion Ciudadana', subArea: 'COMANDO PATRULLA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000556731', identification: 'AE971MA', mainArea: 'Proteccion Ciudadana', subArea: 'COMANDO PATRULLA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000587637', identification: 'AE971MG', mainArea: 'Gobierno', subArea: 'DELEGACIONES', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431000594013', identification: 'HWJ193', mainArea: 'Proteccion Ciudadana', subArea: 'EXPLOSIVOS', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000653975', identification: 'AC855RZ', mainArea: 'Proteccion Ciudadana', subArea: 'COMANDO PATRULLA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000699044', identification: 'AE424PX', mainArea: 'Proteccion Ciudadana', subArea: 'COMANDO PATRULLA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000699051', identification: 'AE424PV', mainArea: 'Proteccion Ciudadana', subArea: 'COMANDO PATRULLA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000699069', identification: 'AE377RZ', mainArea: 'Proteccion Ciudadana', subArea: 'COMISARÍA OPEN DOOR', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000699093', identification: 'AE424PU', mainArea: 'Proteccion Ciudadana', subArea: 'COMANDO PATRULLA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000699101', identification: 'AE365KO', mainArea: 'Proteccion Ciudadana', subArea: 'DESTACAMENTO TORRES', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000699119', identification: 'AE365HB', mainArea: 'Proteccion Ciudadana', subArea: 'COMANDO PATRULLA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000699127', identification: 'AE445RH', mainArea: 'Proteccion Ciudadana', subArea: 'COMANDO PATRULLA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000699143', identification: 'AE377RO', mainArea: 'Proteccion Ciudadana', subArea: 'COMISARÍA 2DA JAUREGUI', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000737687', identification: 'VVX235', mainArea: 'Proteccion Ciudadana', subArea: 'PROTECCIÓN CIUDADANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000737695', identification: 'ICS866', mainArea: 'Proteccion Ciudadana', subArea: 'SECRETARÍA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431000946262', identification: 'MECANICA', mainArea: 'Proteccion Ciudadana', subArea: 'CONTROL URBANO', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001043663', identification: 'AF252UA', mainArea: 'Proteccion Ciudadana', subArea: 'SECRETARÍA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001043689', identification: 'AF177EZ', mainArea: 'Economia', subArea: 'PATRIMONIO', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001072480', identification: 'AF301WC', mainArea: 'Proteccion Ciudadana', subArea: 'COMANDO PATRULLA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001072498', identification: 'AF301WD', mainArea: 'Jefatura de Gabinete', subArea: 'INSPECCIÓN GENERAL', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001103723', identification: 'A154WOU', mainArea: 'Proteccion Ciudadana', subArea: 'COMANDO PATRULLA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001103756', identification: 'A154WOT', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001103772', identification: 'A154WOS', mainArea: 'Proteccion Ciudadana', subArea: 'COMANDO PATRULLA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001103780', identification: 'A154WOW', mainArea: 'Proteccion Ciudadana', subArea: 'COMANDO PATRULLA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001103806', identification: 'A154WOV', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001103822', identification: 'A154WOX', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001103848', identification: 'A154WOY', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001103871', identification: 'A156UBB', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001103905', identification: 'A156UBD', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001244527', identification: 'AF094GG', mainArea: 'Desarrollo Humano', subArea: 'SECRETARIA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001259194', identification: 'AF177EY', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431001372252', identification: 'DEW317', mainArea: 'Servicios Publicos', subArea: 'SERVICIOS SANITARIOS', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001576381', identification: 'AF538TN', mainArea: 'Gobierno', subArea: 'DELEGACIÓN PUEBLO NUEVO', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001676629', identification: 'OHE178', mainArea: 'Desarrollo Humano', subArea: 'ABORDAJE', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001696072', identification: 'AA330TB', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431001744427', identification: 'AD433WU', mainArea: 'Proteccion Ciudadana', subArea: 'SUPERINTENDENCIA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001744435', identification: 'AD419LE', mainArea: 'Proteccion Ciudadana', subArea: 'SUPERINTENDENCIA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001744500', identification: 'AF238YI', mainArea: 'Proteccion Ciudadana', subArea: 'RURAL', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431001744526', identification: 'AF153OF', mainArea: 'Proteccion Ciudadana', subArea: 'RURAL', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431001744534', identification: 'AF123XS', mainArea: 'Proteccion Ciudadana', subArea: 'RURAL', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431001744542', identification: 'AF173KR', mainArea: 'Proteccion Ciudadana', subArea: 'RURAL', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431001744559', identification: 'AF238ZS', mainArea: 'Proteccion Ciudadana', subArea: 'RURAL', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431001744575', identification: 'AF716YU', mainArea: 'Gobierno', subArea: 'SECRETARIA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001754319', identification: 'AE424PR', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001814618', identification: 'WKF113', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'maquinaria', allowedFuel: 'ambos' },
  { cardNumber: '70841431001857716', identification: 'AE377RL', mainArea: 'Proteccion Ciudadana', subArea: 'PROTECCION CIUDADANA', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431001884322', identification: 'CORTINEZ', mainArea: 'Gobierno', subArea: 'DELEGACIÓN CORTINEZ', cardType: 'maquinaria', allowedFuel: 'ambos' },
  { cardNumber: '70841431001935900', identification: 'CZT585', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431001950594', identification: 'DEFENSACIVIL', mainArea: 'Jefatura de Gabinete', subArea: 'DEFENSA CIVIL', cardType: 'maquinaria', allowedFuel: 'ambos' },
  { cardNumber: '70841431001965238', identification: 'AF689RJ', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431001965345', identification: 'AF729ND', mainArea: 'Proteccion Ciudadana', subArea: 'PROTECCION CIUDADANA', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431001965360', identification: 'AF729WZ', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431001965378', identification: 'AF729WW', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431001965386', identification: 'AF772NP', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431001965394', identification: 'AF843UD', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431001965402', identification: 'AF747XK', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431001965410', identification: 'AF781BY', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431001965436', identification: 'AF781BZ', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431002113630', identification: 'AF430TL', mainArea: 'Proteccion Ciudadana', subArea: 'COMISARIA DE LA MUJER', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431002113663', identification: 'AF430TN', mainArea: 'Proteccion Ciudadana', subArea: 'COMANDO PATRULLA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431002166729', identification: 'AA893SA', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431002166737', identification: 'TALLER', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'maquinaria', allowedFuel: 'ambos' },
  { cardNumber: '70841431002201021', identification: 'CIGORDIA', mainArea: 'Desarrollo Productivo', subArea: 'DESARROLLO PRODUCTIVO', cardType: 'maquinaria', allowedFuel: 'ambos' },
  { cardNumber: '70841431002213877', identification: 'AE512SV', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431002234527', identification: 'AG191UX', mainArea: 'Intendencia', subArea: 'PRIVADA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431002234535', identification: 'AG191UZ', mainArea: 'Gobierno', subArea: 'DELEGACIÓN CARLOS KEEN', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431002234543', identification: 'AG191UY', mainArea: 'Intendencia', subArea: 'CEREMONIAL', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431002246141', identification: 'FZG728', mainArea: 'Economia', subArea: 'FORD FOCUS', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431002250697', identification: 'AG243TE', mainArea: 'Servicios Publicos', subArea: 'RESIDUOS SÓLIDOS', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431002266487', identification: 'KCG368', mainArea: 'Proteccion Ciudadana', subArea: 'TRANSITO', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431002279688', identification: 'AF758SS', mainArea: 'Desarrollo Humano', subArea: 'ABORDAJE', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431002298084', identification: 'MXQ474', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431002416348', identification: 'EUJ98', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431002425208', identification: 'DEPORTES', mainArea: 'Desarrollo Humano', subArea: 'DEPORTES', cardType: 'maquinaria', allowedFuel: 'ambos' },
  { cardNumber: '70841431002444431', identification: 'AE187IH', mainArea: 'Proteccion Ciudadana', subArea: 'PROTECCION CIUDADANA', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431002497546', identification: 'AF094GH', mainArea: 'Proteccion Ciudadana', subArea: 'SECRETARIA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431002531971', identification: 'AF094GF', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431002564063', identification: 'ESP. VERDE', mainArea: 'Servicios Publicos', subArea: 'ESPACIOS VERDES', cardType: 'maquinaria', allowedFuel: 'ambos' },
  { cardNumber: '70841431002564071', identification: 'EWD09', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431002572314', identification: 'AG528MG', mainArea: 'Proteccion Ciudadana', subArea: 'SECRETARIA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431002575978', identification: 'CQY69', mainArea: 'Gobierno', subArea: 'DELEGACIÓN TORRES', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431002587684', identification: 'AG191UW', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431002592080', identification: 'WHS684', mainArea: 'Servicios Publicos', subArea: 'SERVICIOS SANITARIOS', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431002714411', identification: 'DOQ869', mainArea: 'Gobierno', subArea: 'DELEGACIÓN TORRES', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431002881756', identification: 'AA873NX', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431003130740', identification: 'AD 174 HI', mainArea: 'Salud', subArea: 'POLICLÍNICO', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431003194290', identification: 'A224SVF', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003194332', identification: 'A224SVA', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003194365', identification: 'A224SVD', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003194407', identification: 'A224SVE', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003194464', identification: 'A224SVB', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003194498', identification: 'AC636RU', mainArea: 'Proteccion Ciudadana', subArea: 'MORGUERA', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431003268276', identification: 'AG191UV', mainArea: 'Intendencia', subArea: 'PRIVADA', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431003451757', identification: 'A224SVC', mainArea: 'Proteccion Ciudadana', subArea: 'TRÁNSITO', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003516534', identification: 'AG893QV', mainArea: 'Proteccion Ciudadana', subArea: 'CRIA 3RA OPEN DOOR', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003516567', identification: 'AG924IQ', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003516583', identification: 'AG893QX', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003516641', identification: 'AG924IN', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003517433', identification: 'AG924IL', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003517441', identification: 'AG924IO', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003517458', identification: 'AG924IP', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003517466', identification: 'AG893QU', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003517581', identification: 'AG893QT', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003517599', identification: 'AG857AX', mainArea: 'Proteccion Ciudadana', subArea: 'PROTECCIÓN CIUDADANA', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431003517649', identification: 'AG857AQ', mainArea: 'Proteccion Ciudadana', subArea: 'DESTACAMENTO BRAHAMA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003517664', identification: 'AG857AV', mainArea: 'Proteccion Ciudadana', subArea: 'PROTECCIÓN CIUDADANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003517672', identification: 'AG857AT', mainArea: 'Proteccion Ciudadana', subArea: 'PROTECCIÓN CIUDADANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003517680', identification: 'AG857AU', mainArea: 'Proteccion Ciudadana', subArea: 'COMANDO DE PATRULLAS', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003517698', identification: 'AG857AY', mainArea: 'Proteccion Ciudadana', subArea: 'DESTACAMENTO ESTACIÓN', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431003517714', identification: 'AG857AS', mainArea: 'Proteccion Ciudadana', subArea: 'PROTECCIÓN CIUDADANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003517730', identification: 'AG857AZ', mainArea: 'Proteccion Ciudadana', subArea: 'COMISARIA LUJÁN 1RA', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431003584011', identification: 'NZA023', mainArea: 'Proteccion Ciudadana', subArea: 'SECRETARÍA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003585265', identification: 'AG893QW', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003723601', identification: 'PAZ618', mainArea: 'Gobierno', subArea: 'DELEGACIÓN OLIVERA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003723619', identification: 'PAZ619', mainArea: 'Jefatura de Gabinete', subArea: 'COMUNICACIONES', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003766816', identification: '5341', mainArea: 'Desarrollo Productivo', subArea: 'PRODUCCIÓN', cardType: 'maquinaria', allowedFuel: 'ambos' },
  { cardNumber: '70841431003797928', identification: 'AH230ZZ', mainArea: 'Desarrollo Humano', subArea: 'SECRETARÍA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003797969', identification: 'AH230ZY', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431003797977', identification: 'AH230ZW', mainArea: 'Obras Publicas', subArea: 'OBRAS PÚBLICAS', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003798280', identification: 'AH230ZV', mainArea: 'Intendencia', subArea: 'PRIVADA', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431003798306', identification: 'AH230ZX', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431003798330', identification: 'AH132QS', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431003798397', identification: 'AH132QT', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431003798439', identification: 'AH132QQ', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431003798496', identification: 'AH132QR', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431003803395', identification: 'A224SVG', mainArea: 'Proteccion Ciudadana', subArea: 'TRÁNSITO', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003840546', identification: 'AA873NY', mainArea: 'Gobierno', subArea: 'DELEGACIÓN PUEBLO NUEVO', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431003840561', identification: 'PUEBLO NUEVO', mainArea: 'Gobierno', subArea: 'DELEGACIÓN PUEBLO NUEVO', cardType: 'maquinaria', allowedFuel: 'ambos' },
  { cardNumber: '70841431003840587', identification: 'ONE656', mainArea: 'Gobierno', subArea: 'DELEGACIÓN JAUREGUI', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431003875765', identification: 'KPT941', mainArea: 'Desarrollo Productivo', subArea: 'PRODUCCIÓN', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003889907', identification: 'AG857AU', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003889923', identification: 'AG857AW', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003889931', identification: 'AF734LF', mainArea: 'Proteccion Ciudadana', subArea: 'GUARDIA URBANA', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431003942631', identification: 'AE512SW', mainArea: 'Servicios Publicos', subArea: 'RESIDUOS SÓLIDOS', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431003970632', identification: 'AH413ZQ', mainArea: 'Proteccion Ciudadana', subArea: 'TRÁNSITO', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431003970657', identification: 'AH369YQ', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431003970673', identification: 'AH369YP', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431003977413', identification: 'AH369YO', mainArea: 'Servicios Publicos', subArea: 'TALLER 1', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431004003086', identification: 'HUH686', mainArea: 'Proteccion Ciudadana', subArea: 'PROTECCIÓN', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431004036466', identification: 'AE512SX', mainArea: 'Desarrollo Humano', subArea: 'ABORDAJE', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431004063700', identification: 'OLIVERA', mainArea: 'Gobierno', subArea: 'DELEGACIÓN OLIVERA', cardType: 'maquinaria', allowedFuel: 'ambos' },
  { cardNumber: '70841431004063767', identification: 'DEG24', mainArea: 'Gobierno', subArea: 'DELEGACIÓN OLIVERA', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431004169937', identification: 'WSF923', mainArea: 'Gobierno', subArea: 'DELEGACIÓN OLIVERA', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431004208974', identification: 'AG409JF', mainArea: 'Servicios Publicos', subArea: 'AGUA CORRIENTE', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431004231414', identification: 'AB043WS', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'ambos' },
  { cardNumber: '70841431004272269', identification: 'AH413ZP', mainArea: 'Proteccion Ciudadana', subArea: 'TRÁNSITO', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431004276476', identification: 'AG344TS', mainArea: 'Salud', subArea: 'HOSPITAL', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431004321389', identification: 'WRW349', mainArea: 'Gobierno', subArea: 'DELEGACIÓN PUEBLO NUEVO', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431004321405', identification: 'CKJ839', mainArea: 'Gobierno', subArea: 'DELEGACIÓN JAUREGUI', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431004321413', identification: 'AG857AR', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'nafta' },
  { cardNumber: '70841431004426212', identification: 'WSF922', mainArea: 'Gobierno', subArea: 'DELEGACIÓN PUEBLO NUEVO', cardType: 'vehiculo', allowedFuel: 'gasoil' },
  { cardNumber: '70841431004551134', identification: 'AWV581', mainArea: 'Proteccion Ciudadana', subArea: 'POLICIA LOCAL', cardType: 'vehiculo', allowedFuel: 'nafta' },
]

async function main() {
  console.log('🌱 Starting database seeding...')

  const user = await prisma.user.findFirst()
  if (!user) {
    console.error('❌ No user found. Please create a user first.')
    return
  }

  // Get unique main areas
  const uniqueMainAreas = Array.from(new Set(data.map(item => item.mainArea)))
  
  for (const mainAreaName of uniqueMainAreas) {
    await prisma.mainArea.upsert({
      where: { name: mainAreaName },
      update: {},
      create: { name: mainAreaName }
    })
  }
  console.log(`✅ Created ${uniqueMainAreas.length} main areas`)

  const mainAreas = await prisma.mainArea.findMany()
  const mainAreaMap = new Map(mainAreas.map(area => [area.name, area]))

  // Get unique sub areas
  const uniqueSubAreas = Array.from(new Set(data.map(item => `${item.mainArea}|${item.subArea}`)))
  
  for (const subAreaKey of uniqueSubAreas) {
    const [mainAreaName, subAreaName] = subAreaKey.split('|')
    const mainArea = mainAreaMap.get(mainAreaName)
    if (mainArea) {
      await prisma.subArea.upsert({
        where: { name_parentAreaId: { name: subAreaName, parentAreaId: mainArea.id } },
        update: {},
        create: { name: subAreaName, parentAreaId: mainArea.id }
      })
    }
  }
  console.log(`✅ Created ${uniqueSubAreas.length} sub areas`)

  const subAreas = await prisma.subArea.findMany()
  const subAreaMap = new Map()
  for (const subArea of subAreas) {
    const mainArea = mainAreas.find(ma => ma.id === subArea.parentAreaId)
    if (mainArea) {
      subAreaMap.set(`${mainArea.name}|${subArea.name}`, subArea)
    }
  }

  let cardsCreated = 0
  for (const cardData of data) {
    const subAreaKey = `${cardData.mainArea}|${cardData.subArea}`
    const subArea = subAreaMap.get(subAreaKey)
    const mainArea = mainAreaMap.get(cardData.mainArea)
    
    if (subArea && mainArea) {
      const card = await prisma.card.upsert({
        where: { cardNumber: cardData.cardNumber },
        update: {
          identification: cardData.identification,
          areaId: mainArea.id,
          subAreaId: subArea.id,
          cardType: cardData.cardType,
          allowedFuel: cardData.allowedFuel,
        },
        create: {
          cardNumber: cardData.cardNumber,
          identification: cardData.identification,
          areaId: mainArea.id,
          subAreaId: subArea.id,
          cardType: cardData.cardType,
          allowedFuel: cardData.allowedFuel,
        }
      })

      // Create initial CardAreaHistory
      const existingHistory = await prisma.cardAreaHistory.findFirst({
        where: { cardId: card.id, validTo: null }
      })
      if (!existingHistory) {
        await prisma.cardAreaHistory.create({
          data: {
            cardId: card.id,
            mainAreaId: mainArea.id,
            subAreaId: subArea.id,
            validFrom: new Date('2000-01-01'),
            validTo: null,
          }
        })
      }
      cardsCreated++
    }
  }

  console.log(`✅ Created/updated ${cardsCreated} cards`)
  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())