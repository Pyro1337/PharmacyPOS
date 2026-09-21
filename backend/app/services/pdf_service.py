from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io
from datetime import datetime

def format_pyg(amount: int) -> str:
    # 50.000 PYG format with dots
    s = f"{amount:,}".replace(",", ".")
    return f"{s} PYG"

def generate_cierre_pdf(caja, ventas, vendedor_nombre: str, farmacia_nombre: str) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm, leftMargin=15*mm, rightMargin=15*mm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('TitleCenter', parent=styles['Title'], alignment=TA_CENTER, fontSize=16, spaceAfter=2*mm)
    subtitle_style = ParagraphStyle('SubtitleCenter', parent=styles['Normal'], alignment=TA_CENTER, fontSize=10, textColor=colors.grey, spaceAfter=4*mm)
    heading_style = ParagraphStyle('Heading', parent=styles['Heading3'], fontSize=11, textColor=colors.HexColor('#1e3a8a'), spaceBefore=4*mm, spaceAfter=2*mm)
    normal_style = styles['Normal']
    normal_style.fontSize = 9

    story = []

    story.append(Paragraph("CIERRE DE CAJA DIARIO", title_style))
    story.append(Paragraph(farmacia_nombre, subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#1e3a8a'), spaceAfter=4*mm))

    # Info header
    info_data = [
        [f"FECHA: {caja.fecha.strftime('%d/%m/%Y')}", f"CAJA #: {caja.numero_caja}"],
        [f"VENDEDOR: {vendedor_nombre}", f"TURNO: {caja.turno.value.upper()}"],
    ]
    t = Table(info_data, colWidths=[85*mm, 85*mm])
    t.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t)
    story.append(Spacer(1, 4*mm))

    # Saldo inicial
    story.append(Paragraph("SALDO INICIAL", heading_style))
    story.append(Paragraph(f"Efectivo: {format_pyg(caja.saldo_inicial)}<br/>Observaciones: {caja.notas_apertura or '---'}", normal_style))
    story.append(Spacer(1, 2*mm))

    # Ventas del día agrupadas por método
    story.append(Paragraph("VENTAS DEL DÍA", heading_style))
    total_ventas = sum(v.total for v in ventas) if ventas else 0
    # agrupar
    metodos = {}
    for v in ventas:
        key = v.metodo_pago.value if hasattr(v.metodo_pago, 'value') else str(v.metodo_pago)
        metodos[key] = metodos.get(key, {"count":0, "total":0})
        metodos[key]["count"] += 1
        metodos[key]["total"] += v.total
    story.append(Paragraph(f"Total ventas: {format_pyg(total_ventas)} ({len(ventas)} transacciones)", normal_style))
    if metodos:
        ventas_rows = [["Método", "Transacciones", "Total"]]
        for k, v in metodos.items():
            ventas_rows.append([k.replace('_',' ').title(), str(v["count"]), format_pyg(v["total"])])
        vt = Table(ventas_rows, colWidths=[60*mm, 50*mm, 60*mm])
        vt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e3a8a')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f0f4ff')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(Spacer(1, 2*mm))
        story.append(vt)

    # Descuentos
    total_descuentos = sum(v.monto_descuento for v in ventas) if ventas else 0
    story.append(Paragraph("DESCUENTOS APLICADOS", heading_style))
    story.append(Paragraph(f"Total descuentos: {format_pyg(total_descuentos)}", normal_style))

    # Movimientos manuales
    story.append(Paragraph("MOVIMIENTOS MANUALES", heading_style))
    if caja.movimientos:
        mov_rows = [["Tipo", "Descripción", "Monto"]]
        for m in caja.movimientos:
            mov_rows.append([m.get("tipo",""), m.get("descripcion",""), format_pyg(m.get("monto",0))])
        mt = Table(mov_rows, colWidths=[40*mm, 90*mm, 40*mm])
        mt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e3a8a')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(mt)
    else:
        story.append(Paragraph("Sin movimientos manuales", normal_style))

    # Saldo esperado
    story.append(Paragraph("SALDO ESPERADO", heading_style))
    esperado = caja.saldo_esperado or 0
    # Calcular detalle
    story.append(Paragraph(
        f"Inicial: {format_pyg(caja.saldo_inicial)}<br/>"
        f"+ Ventas (efectivo): {format_pyg(sum(v.total for v in ventas if str(v.metodo_pago)=='MetodoPago.efectivo' or v.metodo_pago.value=='efectivo') if ventas else 0)}<br/>"
        f"+/- Movimientos: {format_pyg(sum(m.get('monto',0) for m in (caja.movimientos or [])))}<br/>"
        f"<b>= ESPERADO: {format_pyg(esperado)}</b>",
        normal_style
    ))

    # Saldo real
    story.append(Paragraph("SALDO REAL", heading_style))
    real = caja.saldo_real if caja.saldo_real is not None else 0
    dif = caja.diferencia if caja.diferencia is not None else (real - esperado)
    dif_str = f"+{format_pyg(dif)} ✓" if dif >=0 else f"{format_pyg(dif)} ✗"
    story.append(Paragraph(f"Efectivo contado: {format_pyg(real)}<br/>Diferencia: {dif_str}", normal_style))

    story.append(Spacer(1, 8*mm))
    story.append(Paragraph("FIRMAS", heading_style))
    firma_data = [
        ["Vendedor: _________________________", "Fecha: __/__/____"],
        ["Supervisor: _______________________", "Fecha: __/__/____"],
    ]
    ft = Table(firma_data, colWidths=[90*mm, 80*mm])
    ft.setStyle(TableStyle([
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TOPPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(ft)

    story.append(Spacer(1, 6*mm))
    story.append(Paragraph(f"Generado el {datetime.now().strftime('%d/%m/%Y %H:%M')} - PharmacyPOS Paraguay", ParagraphStyle('Footer', parent=styles['Normal'], alignment=TA_CENTER, fontSize=7, textColor=colors.grey)))

    doc.build(story)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
