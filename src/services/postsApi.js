// Todas as chamadas à API ficam aqui. As páginas e componentes nunca chamam
// fetch direto: elas usam estas funções. Se a API mudar, mudamos só este arquivo.

const BASE_URL = 'https://dummyjson.com';

async function requisitar(caminho, { method = 'GET', corpo, signal } = {}) {
  const opcoes = { method, signal };

  if (corpo) {
    opcoes.headers = { 'Content-Type': 'application/json' };
    opcoes.body = JSON.stringify(corpo);
  }

  const resposta = await fetch(BASE_URL + caminho, opcoes);

  if (!resposta.ok) {
    // Texto neutro (serve para português e inglês): o idioma da tela explica o resto.
    const erro = new Error(`HTTP ${resposta.status}`);
    erro.status = resposta.status;
    throw erro;
  }

  return resposta.json();
}

// GET /posts?limit=0 traz todos os posts de uma vez (são cerca de 250).
export async function listarPosts(signal) {
  const dados = await requisitar('/posts?limit=0', { signal });
  return dados.posts;
}

// GET /posts/search?q= devolve os posts que contêm o termo.
// Pedimos só o campo id, porque o resto já está carregado na tela.
export async function pesquisarPosts(termo, signal) {
  const q = encodeURIComponent(termo);
  const dados = await requisitar(`/posts/search?q=${q}&limit=0&select=id`, { signal });
  return dados.posts.map((post) => post.id);
}

// GET /posts/{id}/comments
export async function listarComentarios(id, signal) {
  const dados = await requisitar(`/posts/${id}/comments`, { signal });
  return dados.comments;
}

// POST /posts/add (simulado pela API: nada fica salvo no servidor)
export function criarPost(dados) {
  return requisitar('/posts/add', { method: 'POST', corpo: dados });
}

// PUT /posts/{id} (simulado)
export function atualizarPost(id, dados) {
  return requisitar(`/posts/${id}`, { method: 'PUT', corpo: dados });
}

// DELETE /posts/{id} (simulado: a resposta traz isDeleted e deletedOn)
export function excluirPost(id) {
  return requisitar(`/posts/${id}`, { method: 'DELETE' });
}
