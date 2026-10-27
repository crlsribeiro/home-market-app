# O que aconteceu com o Grocery Home em outubro — resumo pra quem não é dev

## Em uma frase
O app foi aprovado na App Store, e a notificação "alguém adicionou um item na lista" — que nunca tinha funcionado, desde o começo do projeto — finalmente está funcionando de verdade.

## 1. App aprovado na loja

A Apple tinha reprovado o app porque as fotos de tela cadastradas na loja só mostravam a tela de login — não mostravam o app sendo realmente usado. Trocamos as fotos por telas reais (lista de compras, modo mercado, histórico) e a Apple aprovou.

## 2. A notificação de "item adicionado" — por que nunca funcionava

Essa era uma promessa antiga: quando alguém da família adiciona um item na lista, todo mundo deveria receber um aviso no celular. Isso nunca funcionou, nem no site, nem no app — e descobrimos que não era **um** problema, eram **quatro problemas diferentes, um escondendo o outro**:

1. **O servidor estava procurando os membros da família no lugar errado** — tipo pedir um endereço numa lista telefônica desatualizada. Corrigido.
2. **O app não sabia mostrar o aviso quando já estava aberto**, nem abrir na tela certa quando a pessoa tocava na notificação. Corrigido.
3. **O celular e a Apple não estavam "combinando direito"** na hora de pegar a identificação necessária pra receber avisos — uma corrida entre dois passos que às vezes dava errado. Corrigido.
4. **A causa mais profunda**: desde que o projeto foi criado, nunca configuramos a "chave de autorização" que permite ao nosso servidor pedir pra Apple entregar notificações nos celulares dos usuários. É como ter o número de telefone certo, mas nunca ter pago a conta pra linha funcionar. Fomos no painel de desenvolvedor da Apple, geramos essa autorização, e cadastramos no nosso sistema.

**Resultado:** testamos de verdade, num celular real — a notificação chegou, com o texto certo, na hora certa.

## 3. Pequenos ajustes de usar o app

Em testes ao vivo, encontramos e corrigimos:
- Texto pequeno demais numa tela (dificulta leitura, principalmente pra quem tem mais dificuldade de visão)
- Contraste de cor abaixo do recomendado pra acessibilidade
- Uma tela sem botão de sair — se a pessoa entrasse ali sem querer, ficava presa
- Um código de convite de família que, por causa de letras maiúsculas/minúsculas, às vezes era impossível de digitar certo

## 4. O que ainda está em andamento

Estamos trabalhando no **modo escuro** (Dark Mode) — a opção de usar o app com cores escuras, para quem prefere ou usa o celular à noite. Ainda não está pronto pra lançar.

## Em números
- 14 problemas resolvidos e já em produção
- 1 funcionalidade nova no ar (notificação de item adicionado)
- 1 funcionalidade em andamento (Dark Mode)
