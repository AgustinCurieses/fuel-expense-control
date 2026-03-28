    // Spacer before Block 2
    worksheet.getRow(currentRow).height = 8
    currentRow++

    // BLOCK 2 header
    safeMerge(worksheet, `A${currentRow}:J${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'EVOLUCIÓN DEL PRECIO POR LITRO'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } }
    worksheet.getCell(`A${currentRow}`).border = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } }
    worksheet.getRow(currentRow).height = 18
    currentRow++

    // BLOCK 2 - calculate price values
    const previousPeriodTotals2 = previousFactura ? await prisma.fuelLog.aggregate({
      where: { factura: previousFactura, status: 'IMPORTED' },
      _sum: { totalCost: true, gallons: true }
    }) : null
    const previousPrecioPromedio = previousPeriodTotals2?._sum?.totalCost && (previousPeriodTotals2._sum.gallons ?? 0) > 0
      ? previousPeriodTotals2._sum.totalCost / previousPeriodTotals2._sum.gallons!
      : 0
    const precioVariation = precioPromedio - previousPrecioPromedio
    const precioVariationPct = previousPrecioPromedio > 0 ? (precioVariation / previousPrecioPromedio) * 100 : 0

    // BLOCK 2 - labels row
    safeMerge(worksheet, `A${currentRow}:B${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Precio actual:'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell(`A${currentRow}`).border = { top: { style: 'medium' }, bottom: { style: 'thin' }, left: { style: 'medium' }, right: { style: 'medium' } }
    safeMerge(worksheet, `C${currentRow}:E${currentRow}`)
    worksheet.getCell(`C${currentRow}`).value = 'Precio anterior:'
    worksheet.getCell(`C${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`C${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell(`C${currentRow}`).border = { top: { style: 'medium' }, bottom: { style: 'thin' }, left: { style: 'medium' }, right: { style: 'medium' } }
    safeMerge(worksheet, `F${currentRow}:H${currentRow}`)
    worksheet.getCell(`F${currentRow}`).value = 'Variación $:'
    worksheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`F${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell(`F${currentRow}`).border = { top: { style: 'medium' }, bottom: { style: 'thin' }, left: { style: 'medium' }, right: { style: 'medium' } }
    safeMerge(worksheet, `I${currentRow}:J${currentRow}`)
    worksheet.getCell(`I${currentRow}`).value = 'Variación %:'
    worksheet.getCell(`I${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`I${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell(`I${currentRow}`).border = { top: { style: 'medium' }, bottom: { style: 'thin' }, left: { style: 'medium' }, right: { style: 'medium' } }
    worksheet.getRow(currentRow).height = 16
    currentRow++

    // BLOCK 2 - values row
    safeMerge(worksheet, `A${currentRow}:B${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = formatARSKPI(precioPromedio)
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 13, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
    worksheet.getCell(`A${currentRow}`).border = { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } }
    safeMerge(worksheet, `C${currentRow}:E${currentRow}`)
    worksheet.getCell(`C${currentRow}`).value = previousFactura ? formatARSKPI(previousPrecioPromedio) : 'Sin dato'
    worksheet.getCell(`C${currentRow}`).font = { name: 'Calibri', size: 13, bold: true }
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`C${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
    worksheet.getCell(`C${currentRow}`).border = { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } }
    safeMerge(worksheet, `F${currentRow}:H${currentRow}`)
    worksheet.getCell(`F${currentRow}`).value = previousFactura ? `${precioVariation >= 0 ? '+ ' : '- '}${formatARSKPI(Math.abs(precioVariation))}` : 'Sin dato'
    worksheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 13, bold: true }
    worksheet.getCell(`F${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
    worksheet.getCell(`F${currentRow}`).border = { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } }
    safeMerge(worksheet, `I${currentRow}:J${currentRow}`)
    worksheet.getCell(`I${currentRow}`).value = previousFactura ? `${precioVariationPct >= 0 ? '+' : ''}${precioVariationPct.toFixed(1).replace('.', ',')}%` : 'Sin dato'
    worksheet.getCell(`I${currentRow}`).font = { name: 'Calibri', size: 13, bold: true }
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`I${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
    worksheet.getCell(`I${currentRow}`).border = { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } }
    worksheet.getRow(currentRow).height = 24
    currentRow++

    // Spacer before Block 3
    worksheet.getRow(currentRow).height = 8
    currentRow++

    // BLOCK 3 header
    safeMerge(worksheet, `A${currentRow}:J${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'CONCENTRACIÓN DEL GASTO'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } }
    worksheet.getCell(`A${currentRow}`).border = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } }
    worksheet.getRow(currentRow).height = 18
    currentRow++

    // BLOCK 3 - calculate concentration values
    const sortedCurrentAreas = Object.entries(consumptionByArea)
      .sort((a, b) => (b[1].importe || 0) - (a[1].importe || 0))
    const top3CurrentTotal = sortedCurrentAreas.slice(0, 3).reduce((sum, [, area]) => sum + (area.importe || 0), 0)
    const currentConcentration = currentTotalAmount > 0 ? (top3CurrentTotal / currentTotalAmount) * 100 : 0
    const sortedPreviousAreas = [...previousByArea].sort((a, b) => (b.totalCost || 0) - (a.totalCost || 0))
    const top3PreviousTotal = sortedPreviousAreas.slice(0, 3).reduce((sum, p) => sum + (p.totalCost || 0), 0)
    const totalPrevForConc = previousByArea.reduce((sum, p) => sum + (p.totalCost || 0), 0)
    const previousConcentration = totalPrevForConc > 0 ? (top3PreviousTotal / totalPrevForConc) * 100 : 0
    const concentrationDelta = currentConcentration - previousConcentration
    const activeAreasCount = Object.keys(consumptionByArea).length

    // BLOCK 3 - labels row
    safeMerge(worksheet, `A${currentRow}:B${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Top 3 actual:'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell(`A${currentRow}`).border = { top: { style: 'medium' }, bottom: { style: 'thin' }, left: { style: 'medium' }, right: { style: 'medium' } }
    safeMerge(worksheet, `C${currentRow}:E${currentRow}`)
    worksheet.getCell(`C${currentRow}`).value = 'Top 3 anterior:'
    worksheet.getCell(`C${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`C${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell(`C${currentRow}`).border = { top: { style: 'medium' }, bottom: { style: 'thin' }, left: { style: 'medium' }, right: { style: 'medium' } }
    safeMerge(worksheet, `F${currentRow}:H${currentRow}`)
    worksheet.getCell(`F${currentRow}`).value = '\u0394 concentración:'
    worksheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`F${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell(`F${currentRow}`).border = { top: { style: 'medium' }, bottom: { style: 'thin' }, left: { style: 'medium' }, right: { style: 'medium' } }
    safeMerge(worksheet, `I${currentRow}:J${currentRow}`)
    worksheet.getCell(`I${currentRow}`).value = '\u00c1reas activas:'
    worksheet.getCell(`I${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`I${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell(`I${currentRow}`).border = { top: { style: 'medium' }, bottom: { style: 'thin' }, left: { style: 'medium' }, right: { style: 'medium' } }
    worksheet.getRow(currentRow).height = 16
    currentRow++

    // BLOCK 3 - values row
    safeMerge(worksheet, `A${currentRow}:B${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = `${currentConcentration.toFixed(1).replace('.', ',')}%`
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 13, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
    worksheet.getCell(`A${currentRow}`).border = { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } }
    safeMerge(worksheet, `C${currentRow}:E${currentRow}`)
    worksheet.getCell(`C${currentRow}`).value = previousFactura ? `${previousConcentration.toFixed(1).replace('.', ',')}%` : 'Sin dato'
    worksheet.getCell(`C${currentRow}`).font = { name: 'Calibri', size: 13, bold: true }
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`C${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
    worksheet.getCell(`C${currentRow}`).border = { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } }
    safeMerge(worksheet, `F${currentRow}:H${currentRow}`)
    worksheet.getCell(`F${currentRow}`).value = previousFactura ? `${concentrationDelta >= 0 ? '+' : ''}${concentrationDelta.toFixed(1).replace('.', ',')} pp` : 'Sin dato'
    worksheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 13, bold: true }
    worksheet.getCell(`F${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
    worksheet.getCell(`F${currentRow}`).border = { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } }
    safeMerge(worksheet, `I${currentRow}:J${currentRow}`)
    worksheet.getCell(`I${currentRow}`).value = `${activeAreasCount} \u00e1reas`
    worksheet.getCell(`I${currentRow}`).font = { name: 'Calibri', size: 13, bold: true }
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`I${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
    worksheet.getCell(`I${currentRow}`).border = { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } }
    worksheet.getRow(currentRow).height = 24
    currentRow++
