# Simulador Visual Interativo de Barreiras Acústicas (Mitigação de Ruído)

Aplicação web interativa desenvolvida para estudantes do ensino superior na área de **Controlo e Prevenção Ambiental (CPA)**.

Permite simular e visualizar, em tempo real, a propagação sonora entre uma fonte industrial e uma habitação, avaliando o efeito de barreiras acústicas de diferentes materiais, alturas, espessuras e posições.

---

## 🚀 Como Executar a Aplicação

Abra o terminal nesta pasta (`app mitigacao ruido`) e execute:

```bash
# 1. Instalar dependências (caso não estejam instaladas)
npm install

# 2. Iniciar o servidor de desenvolvimento
npm run dev
```

Abra o browser no endereço indicado (por padrão: `http://localhost:5173/`).

### Testes Unitários de Física Acústica
```bash
npx vitest run
```

### Compilação de Produção (Build)
```bash
npm run build
```

---

## 🎯 Funcionalidades Principais

1. **Laboratório Virtual 2D Interativo (SVG + Canvas)**:
   - Cenário com fábrica industrial à esquerda, terreno com cota métrica, barreira no centro e habitação à direita com sonómetro virtual.
   - Pega no topo da barreira para esticar a altura verticalmente (0,5 a 6,0 m).
   - Pega central para arrastar a barreira horizontalmente ao longo dos 30 metros de distância.
   - Pega para ajustar altura e posição da fonte sonora.
   - Pega para ajustar altura e posição do microfone recetor na habitação.

2. **Propagação Sonora e Ondas Animadas**:
   - **Laranja**: Ondas incidentes radiais.
   - **Azul**: Ondas refletidas na face frontal (atenuadas por $1 - \alpha$).
   - **Roxo**: Difração sobre o topo da barreira (raios de Fresnel $d_1$ e $d_2$ e ondas de Huygens).
   - **Vermelho**: Transmissão sonora direta através da massa do material.
   - **Verde**: Sombra acústica geométrica.
   - **Mapa de Níveis Sonoros (Heatmap)** em tempo real com gradiente contínuo de decibéis.

3. **5 Materiais Construtivos Reais**:
   - **Betão Armado** ($\rho = 2300\text{ kg/m}^3, R_w = 52\text{ dB}, \alpha_w = 0.05, 180\text{ \euro/m}^2$)
   - **Painel de Madeira Tratada** ($\rho = 650\text{ kg/m}^3, R_w = 30\text{ dB}, \alpha_w = 0.15, 110\text{ \euro/m}^2$)
   - **Chapa Metálica Galvanizada** ($\rho = 7850\text{ kg/m}^3, R_w = 24\text{ dB}, \alpha_w = 0.05, 65\text{ \euro/m}^2$)
   - **Acrílico Transparente (PMMA)** ($\rho = 1190\text{ kg/m}^3, R_w = 32\text{ dB}, \alpha_w = 0.05, 220\text{ \euro/m}^2$)
   - **Painel Acústico Absorvente** ($\rho = 220\text{ kg/m}^3, R_w = 34\text{ dB}, \alpha_w = 0.90, 160\text{ \euro/m}^2$)

4. **Modelo Acústico Fundamentado**:
   - Divergência esférica hemisférica: $L_2 = L_1 - 20\log_{10}(r_2 / r_1)$.
   - Difração no topo segundo **Kurze-Anderson / Maekawa**: $\Delta L_{\text{dif}} = 10\log_{10}(3 + 20N)$.
   - Transmissão através da barreira com $R(f)$.
   - Combinação energética logarítmica de percursos.

5. **Gráficos e Análise (Recharts)**:
   - Comparação Antes vs. Depois por frequência (125 a 4000 Hz) e global em dB(A).
   - Curva de Difração vs. Isolamento do Material vs. Redução Efetiva.

6. **Comparador de Soluções**:
   - Gravação e comparação nos Slots A, B e C.
   - Comparador lado a lado sincronizado.

7. **Modo Didático (5 Desafios)**:
   - Desafio 1: Altura Mínima para $\ge 8\text{ dB}$ de atenuação a 30 m.
   - Desafio 2: Transmissão vs. Difração de Materiais.
   - Desafio 3: A Posição Ótima da Barreira (Curva em "U").
   - Desafio 4: O Efeito da Frequência Sonora ($\lambda = c/f$).
   - Desafio 5: Otimização de Custo-Benefício ($\le 3500\text{ \euro}$).

8. **Exportação Técnica**:
   - Geração de relatório formal em PDF com todos os parâmetros calculados.
