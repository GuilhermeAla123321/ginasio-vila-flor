# QR Codes dos equipamentos

Esta pasta contém 13 QR Codes individuais e a folha pronta para imprimir (`imprimir-qr-codes.html`). Os QR Codes abrem o endereço público com o parâmetro `?equipamento=<slug>`.

## Instalação
1. Publica esta versão do projeto na Vercel (a aplicação precisa de reconhecer o parâmetro `equipamento`).
2. Abre `imprimir-qr-codes.html` no navegador e escolhe Imprimir / Guardar em PDF.
3. Imprime, recorta e coloca cada código na máquina indicada.
4. Testa cada QR com um telemóvel antes de o afixar definitivamente.

## URL base
`https://ginasio-vila-flor.vercel.app/`

Se mudares o domínio, atualiza `generate_qr_codes.py` e executa-o num ambiente com o pacote Python `qrcode` instalado.
