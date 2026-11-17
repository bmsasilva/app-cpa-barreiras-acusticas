import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls

doc = docx.Document()

# Margens
sections = doc.sections
for s in sections:
    s.top_margin = Inches(0.8)
    s.bottom_margin = Inches(0.8)
    s.left_margin = Inches(0.85)
    s.right_margin = Inches(0.85)

# Styling Helpers
def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_padding(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = parse_xml(f'<{m} {nsdecls("w")} w:w="{val}" w:type="dxa"/>')
        tcMar.append(node)
    tcPr.append(tcMar)

# Title Header
p_inst = doc.add_paragraph()
r_inst = p_inst.add_run('Curso TeSP em Gestão de Ambiente e Qualidade · Ensino Superior Politécnico\n')
r_inst.font.name = 'Calibri'
r_inst.font.size = Pt(10)
r_inst.font.bold = True
r_inst.font.color.rgb = RGBColor(100, 116, 139)

r_uc = p_inst.add_run('Unidade Curricular: Controlo e Prevenção Ambiental / Acústica e Ruído')
r_uc.font.name = 'Calibri'
r_uc.font.size = Pt(9.5)
r_uc.font.color.rgb = RGBColor(100, 116, 139)
p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER

# Document Main Title
p_title = doc.add_paragraph()
r_title = p_title.add_run('Guião Laboratorial Prático — Simulação de Mitigação de Ruído')
r_title.font.name = 'Calibri'
r_title.font.size = Pt(18)
r_title.font.bold = True
r_title.font.color.rgb = RGBColor(15, 23, 42)
p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_title.paragraph_format.space_after = Pt(2)

# Subtitle / App Link
p_sub = doc.add_paragraph()
r_sub = p_sub.add_run('Acesso ao Simulador Online: https://bmsasilva.github.io/app-cpa-barreiras-acusticas/')
r_sub.font.name = 'Calibri'
r_sub.font.size = Pt(10)
r_sub.font.bold = True
r_sub.font.color.rgb = RGBColor(2, 132, 199)
p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_sub.paragraph_format.space_after = Pt(14)

# Student Identification Box
t_id = doc.add_table(rows=2, cols=2)
t_id.alignment = WD_TABLE_ALIGNMENT.CENTER
for r in t_id.rows:
    for c in r.cells:
        set_cell_background(c, 'F8FAFC')
        set_cell_padding(c, 80, 80, 120, 120)

t_id.cell(0, 0).paragraphs[0].add_run('Nome do Aluno / Grupo: _____________________________________________').font.size = Pt(9.5)
t_id.cell(0, 1).paragraphs[0].add_run('Turma / Ano: ____________________').font.size = Pt(9.5)
t_id.cell(1, 0).paragraphs[0].add_run('Data de Realização: ____ / ____ / 2026').font.size = Pt(9.5)
t_id.cell(1, 1).paragraphs[0].add_run('Classificação / Rubrica: _________').font.size = Pt(9.5)
doc.add_paragraph().paragraph_format.space_after = Pt(8)

# EXERCÍCIO 1
p_ex1 = doc.add_paragraph()
r_ex1 = p_ex1.add_run('EXERCÍCIO 1: A Posição Estratégica (X) da Barreira Acústica')
r_ex1.font.name = 'Calibri'
r_ex1.font.size = Pt(13)
r_ex1.font.bold = True
r_ex1.font.color.rgb = RGBColor(30, 58, 138)
p_ex1.paragraph_format.space_after = Pt(4)

p_ctx1 = doc.add_paragraph()
r_ctx1 = p_ctx1.add_run('Contexto Profissional (Ambiente & Qualidade):\n')
r_ctx1.font.bold = True
r_ctx1.font.size = Pt(10)
p_ctx1.add_run(
    'Foste contratado como Técnico de Ambiente para avaliar a instalação de uma barreira acústica entre o foco ruidoso de uma fábrica (localizado a x = 0 m) e a fachada de uma habitação vizinha (localizada a x = 30 m). '
    'A administração pretende saber onde é mais vantajoso construir a barreira: encostada à fábrica, no meio do terreno ou encostada à habitação.'
).font.size = Pt(9.5)
p_ctx1.paragraph_format.space_after = Pt(6)

p_obj1 = doc.add_paragraph()
r_obj1 = p_obj1.add_run('Objetivos Pedagógicos:\n')
r_obj1.font.bold = True
r_obj1.font.size = Pt(10)
p_obj1.add_run(
    '1. Compreender o efeito da geometria e da quebra da linha de visão na atenuação por difração (Teorema de Maekawa).\n'
    '2. Relacionar a eficácia acústica pura com o impacto social e visual nos moradores (Desagrado dos Moradores).'
).font.size = Pt(9.5)
p_obj1.paragraph_format.space_after = Pt(6)

p_proc1 = doc.add_paragraph()
r_proc1 = p_proc1.add_run('Procedimento no Simulador:')
r_proc1.font.bold = True
r_proc1.font.size = Pt(10)

proc1_steps = [
    'No painel direito, na aba "Fonte", confirma que a fonte é Pontual (Indústria), Potência = 95 dB, Frequência = 500 Hz, Altura = 1.5 m.',
    'Na aba "Barreira", clica no botão "Desativada" para ATIVAR a barreira. Seleciona o material Betão Armado e fixa a altura em 3.0 m.',
    'Testa as três posições da barreira indicadas na tabela abaixo (deslocando a barreira na imagem ou pelo deslizador) e anota os resultados exibidos na barra inferior e na aba Recetor.'
]
for step in proc1_steps:
    p_step = doc.add_paragraph(style='List Bullet')
    p_step.add_run(step).font.size = Pt(9.5)
    p_step.paragraph_format.space_after = Pt(2)

# Tabela Ex 1
doc.add_paragraph().paragraph_format.space_after = Pt(2)
t1 = doc.add_table(rows=4, cols=6)
t1.alignment = WD_TABLE_ALIGNMENT.CENTER
headers1 = ['Posição da Barreira (X)', 'Distância à Casa', 'Redução Efetiva (ΔL)', 'Nível no Recetor', 'Desagrado Moradores', 'Custo-Eficácia']

for i, h in enumerate(headers1):
    c = t1.cell(0, i)
    set_cell_background(c, '1E293B')
    set_cell_padding(c, 80, 80, 100, 100)
    p = c.paragraphs[0]
    r = p.add_run(h)
    r.font.name = 'Calibri'
    r.font.size = Pt(9)
    r.font.bold = True
    r.font.color.rgb = RGBColor(255, 255, 255)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER

rows_data1 = [
    ('Cenário A: x = 4.0 m\n(Junto à Fonte)', '26.0 m', '', '', '', ''),
    ('Cenário B: x = 15.0 m\n(A Meio Caminho)', '15.0 m', '', '', '', ''),
    ('Cenário C: x = 26.0 m\n(Junto à Habitação)', '4.0 m', '', '', '', '')
]

for row_idx, r_data in enumerate(rows_data1, start=1):
    for col_idx, val in enumerate(r_data):
        c = t1.cell(row_idx, col_idx)
        set_cell_background(c, 'F8FAFC' if row_idx % 2 == 1 else 'FFFFFF')
        set_cell_padding(c, 100, 100, 80, 80)
        p = c.paragraphs[0]
        r = p.add_run(val)
        r.font.name = 'Calibri'
        r.font.size = Pt(9)
        if col_idx == 0:
            r.font.bold = True
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        else:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER

# Questões Ex 1
p_q1_title = doc.add_paragraph()
p_q1_title.paragraph_format.space_before = Pt(8)
r_q1_title = p_q1_title.add_run('Questões de Análise e Decisão Técnica:')
r_q1_title.font.bold = True
r_q1_title.font.size = Pt(10)

q1_list = [
    '1.1. Eficácia Acústica: Em qual das três posições a redução sonora efetiva (ΔL) é menor? Com base na forma como a onda contorna o topo da barreira, explica porque é que o ponto médio (x = 15 m) é a pior escolha acústica.\nResposta: _____________________________________________________________________________________\n_____________________________________________________________________________________________',
    '1.2. Decisão de Gestão Ambiental: Os Cenários A (x = 4 m) e C (x = 26 m) oferecem uma redução em decibéis semelhante. Contudo, do ponto de vista do impacto visual e da aceitação da população, qual deles deves rejeitar imediatamente? Justifica com base no indicador de Desagrado dos Moradores.\nResposta: _____________________________________________________________________________________\n_____________________________________________________________________________________________'
]
for q in q1_list:
    p_q = doc.add_paragraph()
    p_q.add_run(q).font.size = Pt(9.5)
    p_q.paragraph_format.space_after = Pt(4)

doc.add_page_break()

# EXERCÍCIO 2
p_ex2 = doc.add_paragraph()
r_ex2 = p_ex2.add_run('EXERCÍCIO 2: Propagação com a Distância — Indústria (Fixa) vs. Estrada (Móvel)')
r_ex2.font.name = 'Calibri'
r_ex2.font.size = Pt(13)
r_ex2.font.bold = True
r_ex2.font.color.rgb = RGBColor(30, 58, 138)
p_ex2.paragraph_format.space_after = Pt(4)

p_ctx2 = doc.add_paragraph()
r_ctx2 = p_ctx2.add_run('Contexto Profissional (Ambiente & Qualidade):\n')
r_ctx2.font.bold = True
r_ctx2.font.size = Pt(10)
p_ctx2.add_run(
    'No âmbito do licenciamento ambiental e do Regulamento Geral do Ruído (Decreto-Lei n.º 9/2007), um Técnico de Ambiente deve conhecer '
    'como o som viaja no território em função da natureza da fonte. Uma fonte concentrada num ponto (como um motor ou chaminé) dissipa a energia de forma diferente '
    'de uma via rodoviária, onde circula um fluxo contínuo de viaturas em movimento.'
).font.size = Pt(9.5)
p_ctx2.paragraph_format.space_after = Pt(6)

p_obj2 = doc.add_paragraph()
r_obj2 = p_obj2.add_run('Objetivos Pedagógicos:\n')
r_obj2.font.bold = True
r_obj2.font.size = Pt(10)
p_obj2.add_run(
    '1. Diferenciar a propagação em onda esférica (fonte pontual) da propagação em onda cilíndrica (fonte linear).\n'
    '2. Comprovar na prática a regra dos -6 dB vs. -3 dB por cada duplicação da distância e as suas consequências no ordenamento do território.'
).font.size = Pt(9.5)
p_obj2.paragraph_format.space_after = Pt(6)

p_proc2 = doc.add_paragraph()
r_proc2 = p_proc2.add_run('Procedimento no Simulador:')
r_proc2.font.bold = True
r_proc2.font.size = Pt(10)

proc2_steps = [
    'Na aba "Barreira", confirma que a barreira está no estado "Desativada" (queremos analisar apenas a propagação livre pelo terreno).',
    'Na aba "Fonte", verifica que a Potência Sonora está no valor inicial de 95 dB e a Frequência em 500 Hz.',
    'Passo A (Fonte Fixa): Seleciona o botão "Fonte Pontual (Indústria / Fábrica)". Observa a imagem 2D e regista na aba "Recetor" o nível sonoro que atinge a fachada a 30 m.',
    'Passo B (Fonte Móvel): Sem mexer na potência nem na distância, clica no botão "Fonte Linear (Estrada / Tráfego)". Observa a alteração no nível que atinge a habitação a 30 m.'
]
for step in proc2_steps:
    p_step = doc.add_paragraph(style='List Bullet')
    p_step.add_run(step).font.size = Pt(9.5)
    p_step.paragraph_format.space_after = Pt(2)

# Tabela Ex 2
doc.add_paragraph().paragraph_format.space_after = Pt(2)
t2 = doc.add_table(rows=3, cols=5)
t2.alignment = WD_TABLE_ALIGNMENT.CENTER
headers2 = ['Tipo de Fonte Sonora', 'Modelo Físico da Onda', 'Potência na Origem', 'Nível Recebido (a 30 m)', 'Atenuação ao Duplicar Distância']
for i, h in enumerate(headers2):
    c = t2.cell(0, i)
    set_cell_background(c, '1E293B')
    set_cell_padding(c, 80, 80, 100, 100)
    p = c.paragraphs[0]
    r = p.add_run(h)
    r.font.name = 'Calibri'
    r.font.size = Pt(9)
    r.font.bold = True
    r.font.color.rgb = RGBColor(255, 255, 255)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER

rows_data2 = [
    ('Fonte Pontual (Fixa)\nEx.: Compressor / Chaminé', 'Esférica (Hemisférica no solo)', '95 dB @ 500 Hz', '', '-6 dB por duplicação (20 log10 r)'),
    ('Fonte Linear (Móvel)\nEx.: Estrada com tráfego', 'Cilíndrica ao longo da via', '95 dB @ 500 Hz', '', '-3 dB por duplicação (10 log10 r)')
]

for row_idx, r_data in enumerate(rows_data2, start=1):
    for col_idx, val in enumerate(r_data):
        c = t2.cell(row_idx, col_idx)
        set_cell_background(c, 'F8FAFC' if row_idx % 2 == 1 else 'FFFFFF')
        set_cell_padding(c, 100, 100, 80, 80)
        p = c.paragraphs[0]
        r = p.add_run(val)
        r.font.name = 'Calibri'
        r.font.size = Pt(9)
        if col_idx == 0:
            r.font.bold = True
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        elif col_idx in [1, 4]:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        else:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER

# Questões Ex 2
p_q2_title = doc.add_paragraph()
p_q2_title.paragraph_format.space_before = Pt(8)
r_q2_title = p_q2_title.add_run('Questões de Análise e Decisão Técnica:')
r_q2_title.font.bold = True
r_q2_title.font.size = Pt(10)

q2_list = [
    '2.1. Comparação Direta de Níveis: Com exatamente a mesma potência sonora inicial (95 dB) e à mesma distância de 30 metros, qual foi a diferença em decibéis entre o ruído da estrada e o ruído da fábrica? Qual dos dois chega muito mais forte à habitação?\nResposta: _____________________________________________________________________________________\n_____________________________________________________________________________________________',
    '2.2. O Porquê Físico: Porque é que o ruído de uma via rápida não se dissipa tão rapidamente como o de um motor industrial isolado? (Dica: pensa no facto de na estrada haver uma linha contínua de dezenas de veículos cujas frentes de onda cilíndricas se sobrepõem).\nResposta: _____________________________________________________________________________________\n_____________________________________________________________________________________________',
    '2.3. Gestão e Ordenamento do Território: Se uma câmara municipal estiver a planear a construção de uma nova zona residencial, porque é que é muito mais fácil resolver o ruído afastando as casas 20 metros de uma zona industrial do que afastá-las 20 metros de uma autoestrada?\nResposta: _____________________________________________________________________________________\n_____________________________________________________________________________________________'
]
for q in q2_list:
    p_q = doc.add_paragraph()
    p_q.add_run(q).font.size = Pt(9.5)
    p_q.paragraph_format.space_after = Pt(4)

doc.add_page_break()

# EXERCÍCIO 3 / DESAFIO DE PROJETO
p_ex3 = doc.add_paragraph()
r_ex3 = p_ex3.add_run('EXERCÍCIO 3 (DESAFIO DE PROJETO): Otimização Técnico-Económica sob Orçamento Estrito')
r_ex3.font.name = 'Calibri'
r_ex3.font.size = Pt(13)
r_ex3.font.bold = True
r_ex3.font.color.rgb = RGBColor(180, 83, 9)
p_ex3.paragraph_format.space_after = Pt(4)

p_ctx3 = doc.add_paragraph()
r_ctx3 = p_ctx3.add_run('O Desafio de Engenharia e Gestão da Qualidade:\n')
r_ctx3.font.bold = True
r_ctx3.font.size = Pt(10)
p_ctx3.add_run(
    'A administração de uma empresa metalomecânica foi notificada pelo município com um auto de contraordenação devido a ruído ambiental excessivo. '
    'A fábrica emite ruído contínuo a 95 dB (@ 500 Hz, fonte pontual a 1.5 m de altura). Na habitação vizinha (a 30 m de distância, com recetor a 1.5 m de altura), '
    'o sonómetro regista atualmente 65.5 dB sem qualquer barreira, violando os limites regulamentares.\n\n'
    'Como Técnico de Ambiente e Qualidade, foste encarregado de projetar uma barreira acústica (comprimento de 20 m). '
    'O Conselho de Administração aprovou uma verba orçamental máxima e o Município impôs restrições sociais rigorosas. '
    'Tens de dimensionar os 4 parâmetros da barreira: Material Construtivo, Espessura (e), Altura (h) e Posição (X).'
).font.size = Pt(9.5)
p_ctx3.paragraph_format.space_after = Pt(6)

# Caixas de Requisitos Obrigatórios
p_req_title = doc.add_paragraph()
r_req_title = p_req_title.add_run('As 4 Condições Obrigatórias de Aprovação (Critérios Eliminatórios):')
r_req_title.font.bold = True
r_req_title.font.size = Pt(10)
p_req_title.paragraph_format.space_after = Pt(4)

reqs = [
    ('1. Critério Acústico Legal (Obrigatório):', ' O nível sonoro recebido na habitação com a barreira tem de descer para ≤ 55.0 dB (o que exige uma Redução Efetiva líquida de ΔL ≥ 10.5 dB).'),
    ('2. Critério Orçamental Máximo (Teto Estrito):', ' O Custo Total da barreira NÃO PODE ULTRAPASSAR os 5.000 € (cinco mil euros). Propostas com custo superior a 5.000 € são chumbadas pela administração.'),
    ('3. Critério Social e Visual (Consulta Pública):', ' O Desagrado dos Moradores tem de ser inferior a 30% (nível "Baixo Impacto" verde ou "Impacto Moderado" inicial). Propostas com classificação laranja ou vermelha são rejeitadas pela população.'),
    ('4. Critério de Segurança e Servidão Fabril (NOVO):', ' A barreira NÃO PODE ser instalada a menos de 5.0 metros da fonte (X ≥ 5.0 m). Justificação: corredor obrigatório de segurança contra incêndios, manutenção de máquinas e manobra de empilhadores. Propostas com X < 5.0 m são automaticamente desclassificadas.')
]
for title_r, desc_r in reqs:
    p_r = doc.add_paragraph(style='List Bullet')
    r1 = p_r.add_run(title_r)
    r1.font.bold = True
    r1.font.size = Pt(9.5)
    p_r.add_run(desc_r).font.size = Pt(9.5)
    p_r.paragraph_format.space_after = Pt(2)

# As Armadilhas do Problema
p_traps_title = doc.add_paragraph()
p_traps_title.paragraph_format.space_before = Pt(6)
r_traps_title = p_traps_title.add_run('Atenção às Armadilhas Comuns no Simulador:')
r_traps_title.font.bold = True
r_traps_title.font.size = Pt(10)
r_traps_title.font.color.rgb = RGBColor(185, 28, 28)

traps = [
    'A Chapa Metálica parece muito barata (< 3.000 €), mas com a espessura padrão (2 mm) tem uma massa superficial tão fraca que o som perfura o material por transmissão direta, falhando a meta acústica dos 55 dB!',
    'O Betão Armado e o Painel Absorvente têm excelente isolamento, mas com espessuras padrão e alturas normais custam facilmente mais de 7.000 € a 9.000 €, estourando o limite financeiro dos 5.000 €!',
    'Se tentares colar a barreira à fonte (ex.: x = 2 m a 4 m), a proposta é chumbada pelo critério de segurança fabril (X tem de ser ≥ 5.0 m)!',
    'Se colocares a barreira muito perto da casa (ex.: x = 25 m a 28 m) para poupares em altura, o Desagrado dos Moradores dispara para mais de 60% a 90% (efeito muralha), e o projeto é chumbado pela comunidade!',
    'O Ponto Ótimo: Vais ter de posicionar a barreira a partir dos 5.0 m, testar a Madeira Tratada ou ajustar com precisão a espessura e a altura para vencer o concurso com o melhor Custo-Eficácia (€/dB)!'
]
for t in traps:
    p_t = doc.add_paragraph(style='List Bullet')
    p_t.add_run(t).font.size = Pt(9)
    p_t.paragraph_format.space_after = Pt(2)

# Tabela de Propostas do Aluno
p_tab3_title = doc.add_paragraph()
p_tab3_title.paragraph_format.space_before = Pt(8)
r_tab3_title = p_tab3_title.add_run('Registo de Propostas no "Comparador de Soluções" (Guarda no Slot A e Slot B antes da Solução Final):')
r_tab3_title.font.bold = True
r_tab3_title.font.size = Pt(9.5)

t3 = doc.add_table(rows=4, cols=8)
t3.alignment = WD_TABLE_ALIGNMENT.CENTER
headers3 = ['Proposta', 'Material', 'Espessura (e)', 'Altura (h)', 'Posição (X)', 'Nível (dB)', 'Desagrado (%)', 'Custo Total (€)']
for i, h in enumerate(headers3):
    c = t3.cell(0, i)
    set_cell_background(c, '1E293B')
    set_cell_padding(c, 80, 80, 60, 60)
    p = c.paragraphs[0]
    r = p.add_run(h)
    r.font.name = 'Calibri'
    r.font.size = Pt(8.5)
    r.font.bold = True
    r.font.color.rgb = RGBColor(255, 255, 255)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER

rows_data3 = [
    ('Tentativa 1\n(Slot A)', '', '', '', '', '', '', ''),
    ('Tentativa 2\n(Slot B)', '', '', '', '', '', '', ''),
    ('PROPOSTA FINAL\nVencedora', '', '', '', '', '', '', '')
]

for row_idx, r_data in enumerate(rows_data3, start=1):
    for col_idx, val in enumerate(r_data):
        c = t3.cell(row_idx, col_idx)
        set_cell_background(c, 'FEF3C7' if row_idx == 3 else ('F8FAFC' if row_idx % 2 == 1 else 'FFFFFF'))
        set_cell_padding(c, 80, 80, 60, 60)
        p = c.paragraphs[0]
        r = p.add_run(val)
        r.font.name = 'Calibri'
        r.font.size = Pt(8.5)
        if col_idx == 0:
            r.font.bold = True
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        else:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER

# Questões de Justificação do Projeto
p_q3_title = doc.add_paragraph()
p_q3_title.paragraph_format.space_before = Pt(8)
r_q3_title = p_q3_title.add_run('Parecer Técnico de Justificação à Administração:')
r_q3_title.font.bold = True
r_q3_title.font.size = Pt(10)

q3_list = [
    '3.1. Justificação do Material e Espessura: Qual foi o material e espessura que selecionaste para a solução vencedora? Porque é que materiais muito mais caros (como Acrílico ou Absorvente padrão) ou muito mais baratos (Chapa fina de 2 mm) foram descartados na tua análise?\nResposta: _____________________________________________________________________________________\n_____________________________________________________________________________________________',
    '3.2. Justificação da Posição (X) e Altura (h): Onde escolheste implantar a barreira e com que altura? Como conseguiste garantir simultaneamente que a redução acústica atingiu pelo menos ΔL ≥ 10.5 dB sem que o Desagrado dos Moradores ultrapassasse os 30%?\nResposta: _____________________________________________________________________________________\n_____________________________________________________________________________________________',
    '3.3. Avaliação de Eficiência Financeira: Qual é o valor final do indicador de Custo-Eficácia (€/dB) da tua proposta vencedora? Como usarias este valor para convencer o Diretor Financeiro de que este projeto representa a melhor relação qualidade/preço do mercado?\nResposta: _____________________________________________________________________________________\n_____________________________________________________________________________________________'
]
for q in q3_list:
    p_q = doc.add_paragraph()
    p_q.add_run(q).font.size = Pt(9.5)
    p_q.paragraph_format.space_after = Pt(4)

# Footer Note
p_foot = doc.add_paragraph()
p_foot.paragraph_format.space_before = Pt(8)
r_foot = p_foot.add_run('Nota Técnica: Documento pedagógico desenvolvido para aplicação prática com o Simulador Interativo CPA de Barreiras Acústicas.')
r_foot.font.size = Pt(8)
r_foot.font.italic = True
r_foot.font.color.rgb = RGBColor(148, 163, 184)
p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER

doc.save('Exercicios_Acustica_CPA.docx')
print('Word document updated successfully with Challenge 3: Exercicios_Acustica_CPA.docx')
