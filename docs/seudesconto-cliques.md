# Seudesconto → loja: clique e chegada

O novo script `seudesconto-events.js` registra page_view e shop_click por `/t/v1/b`, só no host de produção. Usa data-cta e caminho público da loja; não manda query nem texto. O beacon não impede navegação, Ctrl/Cmd ou botão do meio. A fila first-party confirma e reenvia com mesmo ID, sem duplicar contagem.

O clique grava sn_hop por 10 min (Secure, SameSite=Lax, domínio raiz). O snippet da loja confirma chegada e apaga o cookie. O CRM confere mesmo visitante e prazo; esta PR depende da migration 0028 e do novo bloco LI 1710873. Cookies bloqueados ou várias abas abertas ao mesmo tempo podem perder a relação do último clique.

Ordem após revisão: deploy crmapi → crmworker → republicar bloco 1710873 gerado pelo CRM → publicar landing **somente depois que codex/meta-pixel-seudesconto estiver na main**. Esta branch usa codex/meta-pixel-seudesconto como base, conforme pedido. Não fez deploy no Firebase nem alterou Google/Meta/LI. Rollback: reverter injeção do novo script; o histórico do CRM fica preservado.

Validação: build preserva template da landing, GA4 e Meta; 12 testes de scripts, incluindo cliques modificados, cookie, IDs e ausência de query.
