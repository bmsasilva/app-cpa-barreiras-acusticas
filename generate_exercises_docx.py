import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_padding(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def format_cell_text(cell, text, bold=False, color_rgb=(15, 23, 42), font_size=9, align=WD_ALIGN_PARAGRAPH.CENTER):
    p = cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run(text)
    r.font.name = 'Calibri'
    r.font.size = Pt(font_size)
    r.font.bold = bold
    r.font.color.rgb = RGBColor(*color_rgb)
    return r

doc = docx.Document()

# Margens estreitas para caber perfeitamente
for section in doc.sections:
    section.top_margin = Inches(0.7)
    section.bottom_margin = Inches(0.7)
    section.left_margin = Inches(0.8)
    section.right_margin = Inches(0.8)

# Cabeçalho da Instituição / Curso
p_inst = doc.add_paragraph()
r_inst = p_inst.add_run('CURSO TÉCNICO SUPERIOR PROFISSIONAL (TeSP) — GESTÃO DE AMBIENTE E QUALIDADE\nLABORATÓRIO DE POLUIÇÃO SONORA E CONTROLO DE RUÍDO AMBIENTAL')
r_inst.font.name = 'Calibri'
r_inst.font.size = Pt(9.5)
r_inst.font.bold = True
r_inst.font.color.rgb = RGBColor(71, 85, 105)
p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_inst.paragraph_format.space_after = Pt(4)

# Título Principal
p_title = doc.add_paragraph()
r_title = p_title.add_run('Guião Prático: Princípios Físicos e Dimensionamento de Barreiras Acústicas')
r_title.font.name = 'Calibri'
r_title.font.size = Pt(15)
r_title.font.bold = True
r_title.font.color.rgb = RGBColor(15, 23, 42)
p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_title.paragraph_format.space_after = Pt(2)

# Subtítulo com link
p_sub = doc.add_paragraph()
r_sub = p_sub.add_run('Acesso ao Simulador Interativo: https://bmsasilva.github.io/app-cpa-barreiras-acusticas/')
r_sub.font.name = 'Calibri'
r_sub.font.size = Pt(10)
r_sub.font.bold = True
r_sub.font.color.rgb = RGBColor(2, 132, 199)
p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_sub.paragraph_format.space_after = Pt(12)

# Caixa de Identificação do Formando
t_id = doc.add_table(rows=2, cols=2)
t_id.alignment = WD_TABLE_ALIGNMENT.CENTER
for r in t_id.rows:
    for c in r.cells:
        set_cell_background(c, 'F8FAFC')
        set_cell_padding(c, 70, 70, 100, 100)

t_id.cell(0, 0).paragraphs[0].add_run('Nome do Aluno / Grupo: _____________________________________________').font.size = Pt(9.5)
t_id.cell(0, 1).paragraphs[0].add_run('Turma / Ano: ____________________').font.size = Pt(9.5)
t_id.cell(1, 0).paragraphs[0].add_run('Data de Realização: ____ / ____ / 2026').font.size = Pt(9.5)
t_id.cell(1, 1).paragraphs[0].add_run('Classificação / Rubrica: _________').font.size = Pt(9.5)
doc.add_paragraph().paragraph_format.space_after = Pt(8)

# -------------------------------------------------------------
# EXERCÍCIO 1: POSIÇÃO DA BARREIRA (X)
# -------------------------------------------------------------
p_ex1 = doc.add_paragraph()
r_ex1 = p_ex1.add_run('EXERCÍCIO 1: Influência da Posição da Barreira (X)')
r_ex1.font.name = 'Calibri'
r_ex1.font.size = Pt(12.5)
r_ex1.font.bold = True
r_ex1.font.color.rgb = RGBColor(30, 58, 138)
p_ex1.paragraph_format.space_after = Pt(2)

p_ctx1 = doc.add_paragraph()
p_ctx1.add_run(
    'Conceito: O efeito de sombra acústica de uma barreira depende da diferença de caminho ótico da onda sonora (Teorema de Maekawa). '
    'Neste exercício, vamos fixar a barreira com altura constante (3.0 m) e material Betão Armado, variando apenas a sua posição horizontal no terreno '
    'entre a fábrica (x = 0 m) e a habitação (x = 30 m).'
).font.size = Pt(9.5)
p_ctx1.paragraph_format.space_after = Pt(4)

p_proc1 = doc.add_paragraph()
r_proc1 = p_proc1.add_run('Procedimento:')
r_proc1.font.bold = True
r_proc1.font.size = Pt(9.5)

proc1_steps = [
    'Na aba "Fonte", confirma: Fonte Pontual (Indústria), Potência = 95 dB, Altura = 1.5 m.',
    'Na aba "Barreira", clica no botão para ATIVAR a barreira. Fixa: Altura = 3.0 m, Material = Betão Armado.',
    'Arrasta o cursor da "Posição da Barreira (X)" para as 3 posições da tabela abaixo e anota os valores registados na barra inferior e no painel Recetor.'
]
for s in proc1_steps:
    p_s = doc.add_paragraph(style='List Bullet')
    p_s.add_run(s).font.size = Pt(9)
    p_s.paragraph_format.space_after = Pt(2)

t1 = doc.add_table(rows=4, cols=5)
t1.alignment = WD_TABLE_ALIGNMENT.CENTER
headers1 = ['Posição (X)', 'Distância à Casa', 'Atenuação (ΔL)', 'Nível Recebido', 'Desagrado Moradores']
for i, h in enumerate(headers1):
    c = t1.cell(0, i)
    set_cell_background(c, '1E293B')
    set_cell_padding(c, 70, 70, 80, 80)
    format_cell_text(c, h, bold=True, color_rgb=(255, 255, 255), font_size=8.5)

rows1 = [
    ('Cenário A: x = 5.0 m (Junto à Fonte)', '25.0 m', '', '', ''),
    ('Cenário B: x = 15.0 m (A Meio Caminho)', '15.0 m', '', '', ''),
    ('Cenário C: x = 26.0 m (Junto à Casa)', '4.0 m', '', '', '')
]
for r_idx, r_data in enumerate(rows1, start=1):
    for c_idx, val in enumerate(r_data):
        c = t1.cell(r_idx, c_idx)
        set_cell_background(c, 'F8FAFC' if r_idx % 2 == 1 else 'FFFFFF')
        set_cell_padding(c, 80, 80, 80, 80)
        format_cell_text(c, val, bold=(c_idx == 0), font_size=8.5, align=WD_ALIGN_PARAGRAPH.LEFT if c_idx == 0 else WD_ALIGN_PARAGRAPH.CENTER)

p_q1 = doc.add_paragraph()
p_q1.paragraph_format.space_before = Pt(6)
p_q1.add_run(
    'Questão 1.1: Em qual das três posições a atenuação acústica (ΔL) foi mais fraca? Porque é que o ponto médio (x = 15 m) é a pior posição física?\n'
    'Resposta: _____________________________________________________________________________________\n\n'
    'Questão 1.2: Os Cenários A (x = 5 m) e C (x = 26 m) têm atenuações acústicas semelhantes. Contudo, porque é que um Técnico de Ambiente deve rejeitar de imediato a colocação a x = 26 m? Observa o valor de Desagrado dos Moradores.\n'
    'Resposta: _____________________________________________________________________________________'
).font.size = Pt(9.5)
p_q1.paragraph_format.space_after = Pt(8)

# -------------------------------------------------------------
# EXERCÍCIO 2: ALTURA DA BARREIRA (H) E LINHA DE VISÃO
# -------------------------------------------------------------
doc.add_page_break()
p_ex2 = doc.add_paragraph()
r_ex2 = p_ex2.add_run('EXERCÍCIO 2: Influência da Altura (H) e Linha de Visão')
r_ex2.font.name = 'Calibri'
r_ex2.font.size = Pt(12.5)
r_ex2.font.bold = True
r_ex2.font.color.rgb = RGBColor(30, 58, 138)
p_ex2.paragraph_format.space_after = Pt(2)

p_ctx2 = doc.add_paragraph()
p_ctx2.add_run(
    'Conceito: Para uma barreira produzir sombra acústica significativa, ela tem de intercetar a linha direta de visão (Line of Sight) entre o foco sonoro '
    'e o recetor humano. Vamos fixar a posição em x = 5.0 m (material Betão Armado) e aumentar progressivamente a altura da barreira.'
).font.size = Pt(9.5)
p_ctx2.paragraph_format.space_after = Pt(4)

p_proc2 = doc.add_paragraph()
r_proc2 = p_proc2.add_run('Procedimento:')
r_proc2.font.bold = True
r_proc2.font.size = Pt(9.5)

proc2_steps = [
    'Mantém a Fonte a 95 dB e a Barreira na posição x = 5.0 m.',
    'Testa as 4 alturas indicadas na tabela abaixo e observa no gráfico 2D quando é que a linha de visão é cortada.',
    'Regista a atenuação obtida e a variação do impacto visual nos moradores.'
]
for s in proc2_steps:
    p_s = doc.add_paragraph(style='List Bullet')
    p_s.add_run(s).font.size = Pt(9)
    p_s.paragraph_format.space_after = Pt(2)

t2 = doc.add_table(rows=5, cols=5)
t2.alignment = WD_TABLE_ALIGNMENT.CENTER
headers2 = ['Altura da Barreira (H)', 'Corta Linha de Visão?', 'Atenuação (ΔL)', 'Nível no Recetor', 'Desagrado Moradores']
for i, h in enumerate(headers2):
    c = t2.cell(0, i)
    set_cell_background(c, '1E293B')
    set_cell_padding(c, 70, 70, 80, 80)
    format_cell_text(c, h, bold=True, color_rgb=(255, 255, 255), font_size=8.5)

rows2 = [
    ('H = 1.0 m (Baixa)', '', '', '', ''),
    ('H = 1.8 m (Ao nível dos olhos)', '', '', '', ''),
    ('H = 2.5 m (Média)', '', '', '', ''),
    ('H = 4.0 m (Muito alta)', '', '', '', '')
]
for r_idx, r_data in enumerate(rows2, start=1):
    for c_idx, val in enumerate(r_data):
        c = t2.cell(r_idx, c_idx)
        set_cell_background(c, 'F8FAFC' if r_idx % 2 == 1 else 'FFFFFF')
        set_cell_padding(c, 80, 80, 80, 80)
        format_cell_text(c, val, bold=(c_idx == 0), font_size=8.5, align=WD_ALIGN_PARAGRAPH.LEFT if c_idx == 0 else WD_ALIGN_PARAGRAPH.CENTER)

p_q2 = doc.add_paragraph()
p_q2.paragraph_format.space_before = Pt(6)
p_q2.add_run(
    'Questão 2.1: Com a barreira a 1.0 m de altura, que redução acústica foi obtida? Por que razão uma barreira que não quebra a linha de visão é ineficaz?\n'
    'Resposta: _____________________________________________________________________________________\n\n'
    'Questão 2.2: Ao subir de 2.5 m para 4.0 m de altura, a atenuação aumentou quantos decibéis? Compensa duplicar a altura da estrutura para obter este ganho? '
    'Considera o impacto estético (Desagrado dos Moradores).\n'
    'Resposta: _____________________________________________________________________________________'
).font.size = Pt(9.5)
p_q2.paragraph_format.space_after = Pt(8)

# -------------------------------------------------------------
# EXERCÍCIO 3: MATERIAL E TRANSMISSÃO DO SOM
# -------------------------------------------------------------
doc.add_page_break()
p_ex3 = doc.add_paragraph()
r_ex3 = p_ex3.add_run('EXERCÍCIO 3: O Papel do Material e do Isolamento (R)')
r_ex3.font.name = 'Calibri'
r_ex3.font.size = Pt(12.5)
r_ex3.font.bold = True
r_ex3.font.color.rgb = RGBColor(30, 58, 138)
p_ex3.paragraph_format.space_after = Pt(2)

p_ctx3 = doc.add_paragraph()
p_ctx3.add_run(
    'Conceito: O som que chega à habitação segue dois caminhos: o som que contorna o topo (difração) e o som que atravessa a própria parede (transmissão). '
    'Se o material for muito leve ou fino, o som perfura a barreira, estragando todo o benefício da sombra acústica (Índice de Redução Sonora R insuficiente).'
).font.size = Pt(9.5)
p_ctx3.paragraph_format.space_after = Pt(4)

p_proc3 = doc.add_paragraph()
r_proc3 = p_proc3.add_run('Procedimento:')
r_proc3.font.bold = True
r_proc3.font.size = Pt(9.5)

proc3_steps = [
    'Fixa a Barreira na posição x = 5.0 m e com Altura = 3.0 m.',
    'Na aba "Barreira", altera sucessivamente o tipo de material e preenche a tabela.',
    'Nota as diferenças no Isolamento Acústico (R) e na reação estética dos moradores.'
]
for s in proc3_steps:
    p_s = doc.add_paragraph(style='List Bullet')
    p_s.add_run(s).font.size = Pt(9)
    p_s.paragraph_format.space_after = Pt(2)

t3 = doc.add_table(rows=6, cols=5)
t3.alignment = WD_TABLE_ALIGNMENT.CENTER
headers3 = ['Material da Barreira', 'Isolamento (R)', 'Atenuação (ΔL)', 'Nível Recebido', 'Desagrado Moradores']
for i, h in enumerate(headers3):
    c = t3.cell(0, i)
    set_cell_background(c, '1E293B')
    set_cell_padding(c, 70, 70, 80, 80)
    format_cell_text(c, h, bold=True, color_rgb=(255, 255, 255), font_size=8.5)

rows3 = [
    ('Chapa Metálica (2 mm)', '', '', '', ''),
    ('Madeira Tratada', '', '', '', ''),
    ('Betão Armado (15 cm)', '', '', '', ''),
    ('Painel Absorvente', '', '', '', ''),
    ('Acrílico Transparente', '', '', '', '')
]
for r_idx, r_data in enumerate(rows3, start=1):
    for c_idx, val in enumerate(r_data):
        c = t3.cell(r_idx, c_idx)
        set_cell_background(c, 'F8FAFC' if r_idx % 2 == 1 else 'FFFFFF')
        set_cell_padding(c, 80, 80, 80, 80)
        format_cell_text(c, val, bold=(c_idx == 0), font_size=8.5, align=WD_ALIGN_PARAGRAPH.LEFT if c_idx == 0 else WD_ALIGN_PARAGRAPH.CENTER)

p_q3 = doc.add_paragraph()
p_q3.paragraph_format.space_before = Pt(6)
p_q3.add_run(
    'Questão 3.1: Porque é que a Chapa Metálica de 2 mm tem pior desempenho acústico do que o Betão, mesmo tendo exatamente a mesma altura (3.0 m)? '
    'Qual dos dois caminhos do som (difração ou transmissão) causou a fuga de ruído?\n'
    'Resposta: _____________________________________________________________________________________\n\n'
    'Questão 3.2: O Acrílico Transparente tem um nível sonoro muito semelhante ao da Madeira. Contudo, em termos de Desagrado dos Moradores, '
    'o Acrílico apresenta um valor muito mais favorável. Por que razão a transparência do material reduz a rejeição da população?\n'
    'Resposta: _____________________________________________________________________________________'
).font.size = Pt(9.5)
p_q3.paragraph_format.space_after = Pt(8)

# -------------------------------------------------------------
# EXERCÍCIO 4: FONTE PONTUAL VS FONTE LINEAR
# -------------------------------------------------------------
doc.add_page_break()
p_ex4 = doc.add_paragraph()
r_ex4 = p_ex4.add_run('EXERCÍCIO 4: Propagação no Solo — Indústria (Pontual) vs. Estrada (Linear)')
r_ex4.font.name = 'Calibri'
r_ex4.font.size = Pt(12.5)
r_ex4.font.bold = True
r_ex4.font.color.rgb = RGBColor(30, 58, 138)
p_ex4.paragraph_format.space_after = Pt(2)

p_ctx4 = doc.add_paragraph()
p_ctx4.add_run(
    'Conceito: Uma fonte pontual (como um motor, chaminé ou compressor) dissipa a energia sonórica em onda esférica (-6 dB por duplicação da distância). '
    'Uma via rodoviária movimentada comporta-se como uma linha contínua de veículos, dissipando energia em onda cilíndrica (-3 dB por duplicação da distância).'
).font.size = Pt(9.5)
p_ctx4.paragraph_format.space_after = Pt(4)

p_proc4 = doc.add_paragraph()
r_proc4 = p_proc4.add_run('Procedimento:')
r_proc4.font.bold = True
r_proc4.font.size = Pt(9.5)

proc4_steps = [
    'Na aba "Barreira", DESATIVA a barreira para medir o som em campo livre (sem obstáculos).',
    'Na aba "Fonte", verifica que a Potência é 95 dB e a Frequência é 500 Hz.',
    'Alterna entre "Fonte Pontual (Indústria)" e "Fonte Linear (Estrada)" e regista o som recebido na fachada a 30 metros.'
]
for s in proc4_steps:
    p_s = doc.add_paragraph(style='List Bullet')
    p_s.add_run(s).font.size = Pt(9)
    p_s.paragraph_format.space_after = Pt(2)

t4 = doc.add_table(rows=3, cols=4)
t4.alignment = WD_TABLE_ALIGNMENT.CENTER
headers4 = ['Tipo de Foco Sonoro', 'Modelo de Onda', 'Nível Recebido (a 30 m)', 'Atenuação Geométrica Teórica']
for i, h in enumerate(headers4):
    c = t4.cell(0, i)
    set_cell_background(c, '1E293B')
    set_cell_padding(c, 70, 70, 80, 80)
    format_cell_text(c, h, bold=True, color_rgb=(255, 255, 255), font_size=8.5)

rows4 = [
    ('Fonte Pontual (Indústria / Fábrica)', 'Esférica (Hemisférica)', '', '-6 dB por cada duplicação da distância (20 log r)'),
    ('Fonte Linear (Estrada / Tráfego)', 'Cilíndrica ao longo da via', '', '-3 dB por cada duplicação da distância (10 log r)')
]
for r_idx, r_data in enumerate(rows4, start=1):
    for c_idx, val in enumerate(r_data):
        c = t4.cell(r_idx, c_idx)
        set_cell_background(c, 'F8FAFC' if r_idx % 2 == 1 else 'FFFFFF')
        set_cell_padding(c, 80, 80, 80, 80)
        format_cell_text(c, val, bold=(c_idx == 0), font_size=8.5, align=WD_ALIGN_PARAGRAPH.LEFT if c_idx in [0, 1, 3] else WD_ALIGN_PARAGRAPH.CENTER)

p_q4 = doc.add_paragraph()
p_q4.paragraph_format.space_before = Pt(6)
p_q4.add_run(
    'Questão 4.1: Com a mesma potência na origem (95 dB), qual é a diferença em decibéis entre o ruído que chega da fábrica e o que chega da estrada? '
    'Qual dos dois focos de ruído requer barreiras muito mais exigentes?\n'
    'Resposta: _____________________________________________________________________________________\n\n'
    'Questão 4.2: Do ponto de vista de planeamento urbano e ambiente, porque é que afastar as casas 20 metros de uma fábrica reduz o ruído de forma muito mais drástica '
    'do que afastá-las 20 metros de uma autoestrada?\n'
    'Resposta: _____________________________________________________________________________________'
).font.size = Pt(9.5)
p_q4.paragraph_format.space_after = Pt(8)

# Guardar documento
doc.save('Exercicios_Acustica_CPA.docx')
print('Documento atualizado com sucesso: Exercicios_Acustica_CPA.docx (4 Exercícios Conceituais)')
