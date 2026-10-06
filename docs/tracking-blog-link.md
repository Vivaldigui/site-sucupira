# Ligação do blog com a loja

O deploy diário publica a branch `main`. O arquivo `src/scripts/sn-tracking.js` precisa conter a mesma versão de `tracking-snippet/sn.js` do CRM: recuperação da entrada original (`sn_context`) e passe temporário (`sn_link`) para transferir a sessão entre `guiadasucupira.com.br` e a loja.

Em 06/10/2026 o código foi integrado à fonte do deploy diário. `npm run build` também verifica a presença do helper e de sua cópia integral no HTML gerado, recusando tracking ausente, duplicado ou incompleto. Isso impede que a publicação recorrente volte a distribuir a versão antiga.

O blog registra sessão/visita, pede um passe em `/t/v1/l` e prepara os links para a loja. A loja resolve em `/t/v1/r`, grava a mesma sessão e aplica o carimbo usado nos pedidos. O passe cifrado dura dez minutos. Erros temporários usam a recuperação da sessão e parâmetros de aquisição disponíveis. Scripts e cookies bloqueados continuam limitando a coleta.

Validação: build; testes de sessão, cookies separados, passe adulterado/expirado, parâmetros Google/UTMs, cupom e `_gl` no CRM; navegação pública real sem identificadores Google inventados e sem compra de teste. Detalhes da API em `docs/tracking/cross-domain-blog.md` no repositório do CRM.
