# Revalidação das sessões no blog e seudesconto

Ambos usam `src/scripts/sn-tracking.js`, sincronizado com o snippet do CRM. O contexto da entrada permanece após a confirmação por até 24 horas e é reenviado idempotentemente com o mesmo ID, URL e horário, inclusive ao passar para a loja. Isso permite ao servidor recuperar uma sessão ausente após restauração sem mudar a origem de sessões existentes.

Quando um navegador antigo tem somente o cookie de confirmação, sem a entrada original, consulta `/t/v1/c`. Se a sessão não existe, começa uma chegada observada agora. Não inventa uma origem anterior. Falha de rede não significa sessão inexistente.

Os oito testes de seudesconto verificam identificadores publicitários, parâmetros privados, links dinâmicos, compartilhamento de sessão com a loja e recuperação da entrada confirmada para os dois hosts. Publicar a API antes dos sites. O build da landing preserva o template original e os assets existentes.

O histórico anterior à exclusão do banco continua incompleto sem backup. Contagens de cliques não permitem recriar sessões perdidas.
