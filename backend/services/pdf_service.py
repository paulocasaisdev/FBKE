import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def gerar_pdf_documento(atleta: dict, doc_tipo: str, doc_titulo: str, status: str = "pendente", signed_at: str = None, assinatura_hash: str = None) -> str:
    """
    Gera um PDF oficial para assinatura eletrônica utilizando ReportLab.
    Retorna o caminho relativo do arquivo salvo.
    """
    # Cria pasta de documentos estáticos no backend se não existir
    app_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    static_dir = os.path.join(app_dir, "static", "documentos")
    os.makedirs(static_dir, exist_ok=True)

    filename = f"{doc_tipo}_{atleta.get('id', 'temp')}.pdf"
    filepath = os.path.join(static_dir, filename)

    # Configura documento PDF
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Estilos customizados
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#990000'),
        alignment=1, # Centralizado
        spaceAfter=15
    )
    
    header_style = ParagraphStyle(
        'DocHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#C8A96E'),
        alignment=1,
        spaceAfter=20
    )

    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1f2937'),
        spaceBefore=10,
        spaceAfter=8,
        borderPadding=2
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#374151')
    )

    bold_label_style = ParagraphStyle(
        'BoldLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#111827')
    )

    footer_style = ParagraphStyle(
        'FooterText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#6b7280'),
        alignment=1
    )

    story = []

    # ── Cabeçalho Oficial da Associação ──────────────────────────────────────
    logo_grkk_path = os.path.join(app_dir, "static", "images", "logo_grkk.png")

    col_center = []
    if os.path.exists(logo_grkk_path):
        col_center.append(Image(logo_grkk_path, width=45, height=45))
    col_center.append(Paragraph("ASSOCIAÇÃO GOJU-RYU KARATÊ-KAI", ParagraphStyle('CenterTitle', parent=title_style, fontSize=14, leading=18, spaceAfter=2, alignment=1)))
    col_center.append(Paragraph("IOGKF Brasil International Okinawan Goju-Ryu Karate Federation | Federação de Karatê da Bahia (FKBA)", ParagraphStyle('CenterHeader', parent=header_style, fontSize=8, leading=11, spaceAfter=0, alignment=1)))

    t_header = Table([[col_center]], colWidths=[520])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 10))

    # ── Título do Documento ──────────────────────────────────────────────────
    story.append(Paragraph(doc_titulo.upper(), ParagraphStyle('Sub', parent=title_style, fontSize=13, textColor=colors.HexColor('#111827'))))
    story.append(Spacer(1, 10))

    # ── Dados do Atleta ──────────────────────────────────────────────────────
    story.append(Paragraph("DADOS CADASTRAIS DO ATLETA", section_style))
    
    dados_cadastrais = [
        [Paragraph("Nome Completo:", bold_label_style), Paragraph(atleta.get("nome", "Não informado"), body_style)],
        [Paragraph("Registro Federativo / Cadastro:", bold_label_style), Paragraph(atleta.get("registro_federacao") or "Pendente", body_style)],
        [Paragraph("E-mail:", bold_label_style), Paragraph(atleta.get("email", "Não informado"), body_style)],
        [Paragraph("Telefone/Celular:", bold_label_style), Paragraph(atleta.get("telefone", "Não informado"), body_style)],
        [Paragraph("CPF:", bold_label_style), Paragraph(atleta.get("cpf", "Não informado"), body_style)],
        [Paragraph("Data Nascimento:", bold_label_style), Paragraph(atleta.get("data_nascimento", "Não informado"), body_style)],
        [Paragraph("Faixa Atual:", bold_label_style), Paragraph(atleta.get("faixa", "Branca"), body_style)],
        [Paragraph("Arte Marcial / Estilo:", bold_label_style), Paragraph(f"{atleta.get('arte_marcial', 'Karate')} / {atleta.get('estilo', 'Goju-Ryu')}", body_style)],
        [Paragraph("Academia / Clube / Dojo:", bold_label_style), Paragraph(atleta.get("academia_clube", "Associação Goju-Ryu Karate Kai"), body_style)],
        [Paragraph("Dados Físicos (Peso / Altura):", bold_label_style), Paragraph(f"{atleta.get('fisico_peso') or '—'} kg / {atleta.get('fisico_altura') or '—'} m", body_style)],
    ]
    
    t_cadastro = Table(dados_cadastrais, colWidths=[160, 360])
    t_cadastro.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
    ]))
    story.append(t_cadastro)
    story.append(Spacer(1, 10))

    # ── Conteúdo conforme o tipo do documento ────────────────────────────────
    if doc_tipo == "ficha_filiacao":
        story.append(Paragraph("TERMO DE ADESÃO E COMPROMISSO", section_style))
        termo_txt = (
            "Ao assinar este documento, declaro meu desejo de filiação e matrícula na "
            "Associação Goju-Ryu Karatê-Kai. Comprometo-me a seguir fielmente as normas, "
            "regulamentos internos e preceitos ético-filosóficos do Karatê-Do Goju-Ryu (Dojo Kun). "
            "Declaro estar em perfeitas condições físicas e mentais para a prática de artes marciais, "
            "isentando a associação e seus respectivos instrutores de responsabilidade por acidentes "
            "decorrentes da prática regular da modalidade esportiva.<br/><br/>"
            "<b>AUTORIZAÇÃO DE USO DE IMAGEM:</b> " + ("AUTORIZO o uso da imagem do atleta para fins promocionais e institucionais da GRKK." if atleta.get("autoriza_uso_imagem") is not False else "NÃO AUTORIZO o uso da imagem do atleta.") + "<br/><br/>"
            "<b>REGRAS E COMPROMISSOS (COMODATO/PROJETO SOCIAL):</b><br/>"
            "• Cada aluno deverá ter seu Karate-Gi (Kimono);<br/>"
            "• O exame de faixa só será permitido com Karate-Gi (Kimono) e frequência mínima de 75% nos treinos e presença escolar;<br/>"
            "• O aluno não poderá ter média escolar inferior a 5,00;<br/>"
            "• Qualquer ato de agressão física ou violência resultará em suspensão e/ou exclusão do projeto;<br/>"
            "• Em caso de desistência, o aluno deverá devolver imediatamente o uniforme e material fornecido sob comodato."
        )
        story.append(Paragraph(termo_txt, body_style))
        story.append(Spacer(1, 15))
        
    elif doc_tipo == "declaracao_saude":
        story.append(Paragraph("QUESTIONÁRIO DE ANAMNESE MÉDICA", section_style))
        
        anamnese_dados = [
            [Paragraph("Tipo Sanguíneo & Fator Rh:", bold_label_style), Paragraph(f"{atleta.get('medico_tipo_sanguineo') or '—'} {atleta.get('medico_fator_rh') or ''}", body_style)],
            [Paragraph("Cartão do SUS:", bold_label_style), Paragraph(atleta.get("medico_sus") or "Não informado", body_style)],
            [Paragraph("Plano de Saúde:", bold_label_style), Paragraph(atleta.get("medico_plano") or "Não informado", body_style)],
            [Paragraph("Contato Emergência:", bold_label_style), Paragraph(f"{atleta.get('medico_emergencia_nome') or '—'} {atleta.get('medico_emergencia_telefone') or ''}", body_style)],
            [Paragraph("Alergias Gerais:", bold_label_style), Paragraph(atleta.get("medico_alergias") or "Nenhuma informada", body_style)],
            [Paragraph("Alergia a Medicamentos:", bold_label_style), Paragraph(atleta.get("medico_alergia_medicamento") or "Nenhuma informada", body_style)],
            [Paragraph("Uso de Medicamento:", bold_label_style), Paragraph(f"Usa medicação? {atleta.get('medico_medicacao_uso') or 'Não'}. " + (f"Qual: {atleta.get('medico_medicacao_lista')}" if atleta.get('medico_medicacao_uso') == 'Sim' else ""), body_style)],
            [Paragraph("Restrições Físicas:", bold_label_style), Paragraph(atleta.get("medico_restricoes") or "Nenhuma informada", body_style)],
            [Paragraph("Diagnósticos Médicos:", bold_label_style), Paragraph(atleta.get("medico_diagnosticos") or "Nenhum informado", body_style)],
        ]
        
        t_medico = Table(anamnese_dados, colWidths=[160, 360])
        t_medico.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
        ]))
        story.append(t_medico)
        story.append(Spacer(1, 15))

    elif doc_tipo == "termo_unificado":
        # Primeira página tem dados cadastrais. Vamos adicionar o termo de compromisso logo abaixo.
        story.append(Paragraph("TERMO DE ADESÃO E COMPROMISSO ÉTICO", section_style))
        termo_txt = (
            "Ao assinar este documento, declaro meu desejo de filiação e matrícula na "
            "Associação Goju-Ryu Karatê-Kai. Comprometo-me a seguir fielmente as normas, "
            "regulamentos internos e preceitos ético-filosóficos do Karatê-Do Goju-Ryu (Dojo Kun). "
            "Declaro estar em perfeitas condições físicas e mentais para a prática de artes marciais, "
            "isentando a associação e seus respectivos instrutores de responsabilidade por acidentes "
            "decorrentes da prática regular da modalidade esportiva.<br/><br/>"
            "<b>AUTORIZAÇÃO DE USO DE IMAGEM:</b> " + ("AUTORIZO o uso da imagem do atleta para fins promocionais e institucionais da GRKK." if atleta.get("autoriza_uso_imagem") is not False else "NÃO AUTORIZO o uso da imagem do atleta.") + "<br/><br/>"
            "<b>REGRAS E COMPROMISSOS (COMODATO/PROJETO SOCIAL):</b><br/>"
            "• Cada aluno deverá ter seu Karate-Gi (Kimono);<br/>"
            "• O exame de faixa só será permitido com Karate-Gi (Kimono) e frequência mínima de 75% nos treinos e presença escolar;<br/>"
            "• O aluno não poderá ter média escolar inferior a 5,00;<br/>"
            "• Qualquer ato de agressão física ou violência resultará em suspensão e/ou exclusão do projeto;<br/>"
            "• Em caso de desistência, o aluno deverá devolver imediatamente o uniforme e material fornecido sob comodato."
        )
        story.append(Paragraph(termo_txt, body_style))
        story.append(Spacer(1, 15))

        # Quebra para a segunda página: Ficha Médica
        story.append(PageBreak())
        
        # Cabeçalho da página 2
        story.append(Paragraph("ASSOCIAÇÃO GOJU-RYU KARATÊ-KAI", ParagraphStyle('P2Title', parent=title_style, fontSize=11, spaceAfter=5)))
        story.append(Paragraph("ANEXO I — QUESTIONÁRIO DE ANAMNESE MÉDICA", ParagraphStyle('P2Sub', parent=title_style, fontSize=10, spaceAfter=15, textColor=colors.HexColor('#1f2937'))))
        
        anamnese_dados = [
            [Paragraph("Tipo Sanguíneo & Fator Rh:", bold_label_style), Paragraph(f"{atleta.get('medico_tipo_sanguineo') or '—'} {atleta.get('medico_fator_rh') or ''}", body_style)],
            [Paragraph("Cartão do SUS:", bold_label_style), Paragraph(atleta.get("medico_sus") or "Não informado", body_style)],
            [Paragraph("Plano de Saúde:", bold_label_style), Paragraph(atleta.get("medico_plano") or "Não informado", body_style)],
            [Paragraph("Contato Emergência:", bold_label_style), Paragraph(f"{atleta.get('medico_emergencia_nome') or '—'} {atleta.get('medico_emergencia_telefone') or ''}", body_style)],
            [Paragraph("Alergias Gerais:", bold_label_style), Paragraph(atleta.get("medico_alergias") or "Nenhuma informada", body_style)],
            [Paragraph("Alergia a Medicamentos:", bold_label_style), Paragraph(atleta.get("medico_alergia_medicamento") or "Nenhuma informada", body_style)],
            [Paragraph("Uso de Medicamento:", bold_label_style), Paragraph(f"Usa medicação? {atleta.get('medico_medicacao_uso') or 'Não'}. " + (f"Qual: {atleta.get('medico_medicacao_lista')}" if atleta.get('medico_medicacao_uso') == 'Sim' else ""), body_style)],
            [Paragraph("Restrições Físicas:", bold_label_style), Paragraph(atleta.get("medico_restricoes") or "Nenhuma informada", body_style)],
            [Paragraph("Diagnósticos Médicos:", bold_label_style), Paragraph(atleta.get("medico_diagnosticos") or "Nenhum informado", body_style)],
        ]
        
        t_medico = Table(anamnese_dados, colWidths=[160, 340])
        t_medico.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
        ]))
        story.append(t_medico)
        story.append(Spacer(1, 15))

        # Quebra para a terceira página: Contrato de Prestação de Serviços
        story.append(PageBreak())
        
        story.append(Paragraph("ASSOCIAÇÃO GOJU-RYU KARATÊ-KAI", ParagraphStyle('P3Title', parent=title_style, fontSize=11, spaceAfter=5)))
        story.append(Paragraph("ANEXO II — CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESPORTIVOS", ParagraphStyle('P3Sub', parent=title_style, fontSize=10, spaceAfter=15, textColor=colors.HexColor('#1f2937'))))
        
        contrato_txt = (
            "<b>CLÁUSULA PRIMEIRA - DO OBJETO:</b> O presente contrato tem por objeto a prestação de serviços "
            "de ensino e treinamento prático de Karatê-Do Goju-Ryu pela Associação Goju-Ryu Karatê-Kai.<br/><br/>"
            "<b>CLÁUSULA SEGUNDA - DAS OBRIGAÇÕES DO ALUNO:</b> O aluno compromete-se a pagar pontualmente as "
            "mensalidades fixadas pela associação, zelar pela conservação das instalações e respeitar as "
            "regras de conduta e hierarquia tradicionais do Dojo (Dojo Kun).<br/><br/>"
            "<b>CLÁUSULA TERCEIRA - DA FREQUÊNCIA E EXAMES:</b> A participação em exames de graduação e chamada "
            "de faixas dependerá do cumprimento da frequência mínima obrigatória registrada em dojo e da "
            "quitação de taxas financeiras vigentes.<br/><br/>"
            "<b>CLÁUSULA QUARTA - DA RESCISÃO:</b> O presente contrato poderá ser rescindido a qualquer momento "
            "mediante solicitação prévia formalizada à secretaria do dojo com antecedência mínima de 15 dias, "
            "sendo devidas as mensalidades correspondentes ao período usufruído."
        )
        story.append(Paragraph(contrato_txt, body_style))
        story.append(Spacer(1, 20))

    # ── Bloco de Assinatura Eletrônica Gov.br ──────────────────────────────────
    story.append(Spacer(1, 20))
    if status == "assinado":
        data_fmt = datetime.fromisoformat(signed_at.replace("Z", "")).strftime("%d/%m/%Y às %H:%M:%S") if signed_at else datetime.now().strftime("%d/%m/%Y")
        
        assinatura_dados = [
            [
                Paragraph("<b>ASSINATURA ELETRÔNICA QUALIFICADA GOV.BR</b>", ParagraphStyle('AssHeader', parent=bold_label_style, fontSize=9, textColor=colors.HexColor('#005599'))),
                Paragraph(f"<b>Assinado por:</b> {atleta.get('nome')}<br/>"
                          f"<b>Data/Hora:</b> {data_fmt} (Horário de Brasília)<br/>"
                          f"<b>Validador ITI:</b> ICP-Brasil / Assinatura Digital do Cidadão<br/>"
                          f"<b>Hash de Segurança:</b> <font face='Courier' size='7'>{assinatura_hash}</font>", ParagraphStyle('AssBody', parent=body_style, fontSize=8, leading=11))
            ]
        ]
        
        t_assinatura = Table(assinatura_dados, colWidths=[150, 370])
        t_assinatura.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0f7ff')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 10),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#005599')),
        ]))
        story.append(t_assinatura)
    else:
        # Caixa pendente
        box_dados = [
            [
                Paragraph("<b>AGUARDANDO ASSINATURA ELETRÔNICA</b>", ParagraphStyle('PenHeader', parent=bold_label_style, fontSize=9, textColor=colors.HexColor('#990000'))),
                Paragraph("Este documento requer assinatura eletrônica através do portal Gov.br para possuir validade jurídica dentro dos quadros oficiais da associação.", ParagraphStyle('PenBody', parent=body_style, fontSize=8, leading=11))
            ]
        ]
        t_box = Table(box_dados, colWidths=[150, 370])
        t_box.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fff5f5')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 10),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e53e3e')),
        ]))
        story.append(t_box)

    story.append(Spacer(1, 40))
    story.append(Paragraph("Este documento é gerado de forma sistêmica pelo portal Goju-Ryu Karatê-Kai.", footer_style))

    # Constrói o PDF
    doc.build(story)
    
    return f"/static/documentos/{filename}"
