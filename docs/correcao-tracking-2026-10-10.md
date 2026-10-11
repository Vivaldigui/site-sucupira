# Correção do tracking — 10/10/2026

## Blog: um caminho por propriedade GA4

A tag `G-L27DL7MMTY` estava vinculada tanto ao destino Blog Sucupira (`G-L27DL7MMTY`, propriedade 543095152) quanto a Guia da Sucupira (`G-VSVWP30JW2`, propriedade 551317982). Como o HTML também configura `G-LZDYVCN9FV`, a propriedade 551317982 recebia o mesmo evento em dois fluxos: 15492599659 e 16045626634.

Em 10/10 por volta de 21h10 BRT, o destino Guia da Sucupira foi separado da tag do blog usando o gerenciador da tag Google. O Google exige atribuir esse destino a outra tag: foi criada “Guia da Sucupira - fluxo separado”, copiando a configuração sem copiar usuários. A nova tag não foi instalada no site. O fluxo e o histórico não foram excluídos.

O HTML continua configurando blog e loja. Não reconectar Guia da Sucupira à tag do blog, pois isso volta a duplicar o consolidado. Histórico anterior continua duplicado; segmentar por fluxo ao compará-lo.

## Landing: cobrir links sem identificador

`seudesconto-events.js` aceita `data-cta` ausente com identificador fixo `link_loja`, preservando as restrições de host, protocolo e caminho. Logo, endereço da loja no bloco de contato e Site oficial do rodapé passam a gerar `shop_click` e o cookie `sn_hop` para confirmar a chegada. Não coleta texto ou query adicional.

Validação: 17 testes do seudesconto, incluindo clique normal, botão do meio, links sem identificador, destinos recusados e preservação de origem. Build mantém o conteúdo do export e injeta os coletores.

O CRM deve considerar 11/10/2026 como primeiro dia completo dessa cobertura, não usar 2 cliques sobre visitantes anteriores à implantação como taxa de abandono. O acompanhamento e o ajuste de cobertura estão no PR correspondente do CRM.
