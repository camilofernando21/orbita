# Órbita

**Cada publicação é uma estrela. Cada assunto, uma constelação.**

A Órbita é uma aplicação web de página única (SPA) feita em React que transforma as publicações da API pública [DummyJSON](https://dummyjson.com/docs/posts) num céu estrelado que dá para explorar, filtrar, abrir, criar, editar e apagar.

Projeto da Avaliação Bimestral (2º bimestre), desenvolvido em dupla.

## Objetivo

Consumir o recurso **Publicações (posts)** da API DummyJSON e apresentar os dados de um jeito que vá além de uma lista: a interface organiza as informações visualmente e deixa o usuário interagir com elas. A identidade visual nasceu do próprio recurso: publicações são coisas que "brilham" mais ou menos conforme o público reage a elas.

## Como o céu funciona

| No céu | Vem do dado da API |
|---|---|
| Uma estrela | Um post (`/posts`) |
| Tamanho da estrela | `views` (visualizações) |
| Brilho da estrela | `reactions.likes` (curtidas) |
| Anel vermelho pulsando | Post polêmico: curtidas e descurtidas quase empatadas |
| Constelação | A tag do post que reúne mais publicações (regra abaixo) |
| Linhas entre estrelas | Ligação mais curta entre os posts da mesma constelação |
| Satélites orbitando a nebulosa | Comentários do post (`/posts/{id}/comments`) |

**Como as constelações são formadas:** a API usa 170 tags diferentes, e muitas aparecem em um ou dois posts só. Se cada tag virasse constelação, o céu teria dezenas de grupos minúsculos. A regra (função `atribuirConstelacoes` em `src/utils/ceu.js`):

1. Tags que aparecem em 20 posts ou mais viram constelação (history, english, american, classic, love, crime, fiction, mystery, french, magical).
2. Para os posts sem nenhuma dessas tags, olhamos a tag mais comum de cada um. Se ela reúne 5 posts ou mais, também vira constelação (por exemplo nature, city e village).
3. Cada post entra na primeira das suas tags que for constelação. Quem não se encaixa vai para a constelação "Diversas".

**Índice de polêmica:** `1 − |curtidas − descurtidas| ÷ (curtidas + descurtidas)`. Um post com 500 curtidas e 480 descurtidas fica perto de 100%. Um post com 500 contra 10 fica perto de 0%.

## Funcionalidades

- **Céu interativo** (página inicial): zoom com a roda do mouse, com pinça no celular ou com as teclas + e −; arrastar para mover; três camadas de estrelas ao fundo que se movem em velocidades diferentes (efeito de profundidade).
- **Telescópio (busca):** usa o endpoint `/posts/search`. Os resultados ficam acesos e a câmera vai até eles.
- **Filtro por constelação:** acende só a constelação escolhida.
- **Página da estrela:** nebulosa gerada por código para aquele post, texto completo, índice de polêmica, comentários e estrelas da mesma constelação.
- **Ouvir:** lê a publicação em voz alta com a Web Speech API do navegador.
- **Nova estrela (POST):** formulário controlado com validação e prévia ao vivo. Depois de enviar, a estrela nasce no céu com animação.
- **Editar (PUT)** e **apagar (DELETE)**, com confirmação. A exclusão vira uma supernova.
- **Catálogo:** o mesmo conteúdo em cartões, com busca, filtro e ordenação.
- **Observatório:** números gerais e rankings (mais vistas, mais polêmicas, mais curtidas, tamanho das constelações).
- **Português e inglês:** seletor PT | EN no cabeçalho (atalho L). Troca a interface inteira e o conteúdo: em português, posts, comentários e tags aparecem traduzidos; em inglês, aparece o texto original da API. A escolha fica salva no navegador.
- **Tema claro e escuro:** céu noturno e carta celeste (mapa antigo em papel). A troca acontece com uma animação circular a partir do botão e a escolha fica salva no navegador.

## Recursos e endpoints utilizados

| Método | Endpoint | Onde é usado |
|---|---|---|
| GET | `/posts?limit=0` | Carrega todas as publicações (céu, catálogo, observatório) |
| GET | `/posts/search?q={termo}&select=id` | Telescópio (busca) |
| GET | `/posts/{id}/comments` | Satélites da página da estrela |
| POST | `/posts/add` | Nova estrela |
| PUT | `/posts/{id}` | Editar estrela |
| DELETE | `/posts/{id}` | Apagar estrela |

Todas as chamadas ficam em `src/services/postsApi.js`.

## Como instalar e executar

Pré-requisito: [Node.js](https://nodejs.org) 20 ou mais recente.

```bash
npm install
npm run dev
```

Depois abra o endereço que aparecer no terminal (normalmente `http://localhost:5173`).

Para gerar a versão de produção: `npm run build` e, para testar essa versão, `npm run preview`.

## Rotas

| Rota | Página |
|---|---|
| `/` | Céu (aceita `?q=termo` e `?constelacao=tag` na URL) |
| `/catalogo` | Catálogo em cartões |
| `/observatorio` | Números e rankings |
| `/estrela/:id` | Detalhe da publicação |
| `/estrela/:id/editar` | Editar publicação |
| `/nova` | Nova publicação |
| qualquer outra | Página "Fora do mapa" |

## Estrutura de pastas

```
src/
├── components/   componentes reutilizáveis (Ceu, Nebulosa, PostCard, PostForm, Legenda, Estados...)
├── contexts/     estado compartilhado (posts, idioma, tema, avisos)
├── data/         traduções para português (traducoes-pt.json)
├── i18n/         textos da interface em português e inglês
├── hooks/        lógica reutilizável (filtro na URL, atalhos de teclado, voz, tamanho da tela)
├── pages/        uma página por rota
├── services/     funções de acesso à API
├── styles/       estilos globais e os dois temas
└── utils/        cálculos do céu (posições, cores, polêmica)
```

## Decisões técnicas

- **React Router (modo de dados)** com `createBrowserRouter`, para usar transições de página (`viewTransition`).
- **Estado global com Context:** os posts são buscados uma vez (`useEffect` + `useState` no `PostsContext`) e todas as páginas leem dali. Assim, o que é criado, editado ou apagado aparece em todas as telas.
- **Filtro na URL:** busca e constelação ficam em `?q=` e `?constelacao=`. Dá para recarregar a página ou mandar o link e o filtro continua.
- **Céu em SVG, sem biblioteca:** cada estrela é um elemento focável de verdade, o que resolve teclado e leitor de tela. A câmera é o `viewBox` do SVG, animado com `requestAnimationFrame`.
- **Céu sempre igual:** as posições vêm de um gerador pseudoaleatório com semente (o id do post). As constelações são distribuídas em espiral (ângulo dourado, como as sementes de um girassol) e depois afastadas até não encostarem.
- **Nebulosas geradas por código:** cada post ganha uma arte própria em SVG, calculada a partir do id, da tag e das visualizações. Nenhuma imagem externa é baixada.
- **Dois idiomas sem biblioteca:** os textos da interface ficam em `src/i18n/textos.js` e são lidos com a função `t('chave')` do `LinguaContext`. O conteúdo da API foi traduzido para português e guardado em `src/data/traducoes-pt.json` (199 posts, 339 comentários e 170 tags). Assim a tradução funciona em qualquer navegador, sem depender de serviço externo na hora.
- **Busca nos dois idiomas:** o telescópio junta o resultado do endpoint `/posts/search` (que procura no texto original, em inglês) com uma busca local no texto traduzido.
- **Sem bibliotecas de interface:** só React, React Router e CSS próprio.

## Acessibilidade e uso sem mouse

| Tecla | Ação |
|---|---|
| ← ↑ → ↓ | Vai para a estrela mais próxima naquela direção |
| Enter | Abre a estrela selecionada |
| + e − | Aproxima e afasta o céu |
| 0 | Mostra o céu inteiro |
| / | Abre o telescópio (busca) |
| N | Nova estrela |
| C | Catálogo |
| O | Observatório |
| T | Alterna o tema |
| L | Alterna português e inglês |
| E | Edita a estrela aberta |
| Esc | Fecha, limpa o filtro ou volta ao céu |
| ? | Mostra a lista de atalhos |

Além disso:

- Link "Pular para o conteúdo" no início da página.
- Foco sempre visível; ao trocar de página, o foco vai para o título da página nova.
- Todos os campos têm `<label>`; erros de validação ficam ligados ao campo por `aria-describedby` e marcados com `aria-invalid`.
- Modais com `<dialog>` nativo (prendem o foco e fecham com Esc).
- Avisos de sucesso e erro anunciados por leitor de tela (`role="status"` e `role="alert"`).
- Contraste conferido nos dois temas; layout responsivo do celular ao monitor grande.
- Respeita a configuração do sistema "reduzir movimento": as animações são desligadas.

## Estados da interface

- **Carregando:** animação de um astro em órbita enquanto a API responde; esqueletos nos comentários.
- **Erro:** tela "Sinal perdido" com botão "Tentar de novo" quando a API falha. Se a busca falhar, o filtro é feito localmente e a tela avisa.
- **Vazio:** "Céu limpo" quando a busca não encontra nada; "Fora do mapa" para endereço inexistente.
- **Sucesso:** aviso na parte de baixo da tela depois de criar, editar ou apagar, mostrando o que a API respondeu.

## Limitações da API

- **POST, PUT e DELETE são simulados.** A API responde como se tivesse salvo, editado ou apagado, mas nada muda no servidor. Por isso, as alterações ficam guardadas só no estado da aplicação e somem quando a página é recarregada.
- **Todo post novo recebe o mesmo id** (o próximo número depois do último post). Se o usuário criar duas estrelas, a aplicação gera um id novo para a segunda, para não haver duas iguais.
- **Posts criados aqui não existem na API:** editar ou apagar um deles faz a API responder 404. Nesse caso a alteração é aplicada só no navegador e o aviso explica o que aconteceu.
- **A busca da API não conhece posts criados ou editados aqui.** Para esses, a busca é feita localmente.
- **O conteúdo vem em inglês.** Por isso a aplicação tem o arquivo de traduções. 52 posts são trechos de livros protegidos por direitos autorais e não foram traduzidos: em português eles aparecem no original, com um aviso explicando o motivo. Os trechos de autores em domínio público (como Charles Dickens) foram traduzidos. Cada texto é marcado com o idioma certo (`lang`), o que ajuda leitores de tela e a leitura em voz alta.
- **Se a API mudar os textos,** a tradução daquele post deixa de bater com o original. Posts criados ou editados aqui aparecem sempre como a pessoa escreveu.
- A API não tem imagens de posts. As nebulosas são geradas pela própria aplicação.

## Integrantes

- Camilo Fernando Bomfim
- Lucas
