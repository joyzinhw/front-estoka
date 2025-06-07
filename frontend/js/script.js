const apiURL = 'https://estoka.onrender.com/produtos';

const signUpButton=document.getElementById('signUpButton');
const signInButton=document.getElementById('signInButton');
const signInForm=document.getElementById('signIn');
const signUpForm=document.getElementById('signup');

signUpButton.addEventListener('click',function(){
    signInForm.style.display="none";
    signUpForm.style.display="block";
})
signInButton.addEventListener('click', function(){
    signInForm.style.display="block";
    signUpForm.style.display="none";
})

carregarProdutos();

async function carregarProdutos() {
  try {
    const res = await fetch(apiURL);
    const produtos = await res.json();

    const tabela = document.getElementById('produtosTable');
    tabela.innerHTML = '';

    produtos.forEach(prod => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${prod.nome}</td>
        <td>${prod.quantidade ?? 0}</td>  <!-- Exibir quantidade -->
        <td>
          <button onclick="deletarProduto('${prod._id}')">DELETAR</button>
        </td>
      `;
      tabela.appendChild(tr);
    });
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    alert('Erro ao carregar produtos.');
  }
}

async function cadastrarProduto() {
  const nome = document.getElementById('produtoNome').value.trim();
  const quantidade = parseInt(document.getElementById('produtoQtd').value);

  if (!nome || isNaN(quantidade) || quantidade < 0) {
    alert('Preencha todos os campos corretamente!');
    return;
  }

  try {
    // Verifica se já existe um produto com o mesmo nome
    const res = await fetch(apiURL);
    const produtos = await res.json();
    const nomeExiste = produtos.some(p => p.nome.toLowerCase() === nome.toLowerCase());

    if (nomeExiste) {
      alert('Já existe um produto com esse nome!');
      return;
    }

    // Cadastrar novo produto
    await fetch(apiURL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ nome, quantidade })
    });

    document.getElementById('produtoNome').value = '';
    document.getElementById('produtoQtd').value = '';
    carregarProdutos();
  } catch (error) {
    console.error('Erro ao cadastrar produto:', error);
    alert('Erro ao cadastrar produto.');
  }
}


async function deletarProduto(id) {
  const confirmar = confirm('Tem certeza que deseja deletar este produto?');
  if (!confirmar) return;

  try {
    await fetch(`${apiURL}/${id}`, {
      method: 'DELETE'
    });
    carregarProdutos();
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    alert('Erro ao deletar produto.');
  }
}

async function movimentarProduto(id, tipo, quantidade) {
  if (!['entrada', 'saida'].includes(tipo) || isNaN(quantidade) || quantidade <= 0) {
    alert('Tipo ou quantidade inválida para movimentação!');
    return;
  }

  try {
    await fetch(`${apiURL}/${id}/movimentar`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ tipo, quantidade })
    });
    carregarProdutos();
    alert('Movimentação realizada com sucesso!');
  } catch (error) {
    console.error('Erro ao movimentar produto:', error);
    alert('Erro ao movimentar produto.');
  }
}

// Novo: função para buscar produto pelo nome, usada nas movimentações
async function buscarProdutoPorNome(nome) {
  try {
    const res = await fetch(apiURL);
    const produtos = await res.json();
    return produtos.find(p => p.nome.toLowerCase() === nome.toLowerCase());
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    alert('Erro ao buscar produto.');
    return null;
  }
}

async function executarMovimento(tipo) {
  const nome = document.getElementById('nomeProdutoMovimento').value.trim();
  const qtd = parseInt(document.getElementById('qtdMovimento').value);

  if (!nome || isNaN(qtd) || qtd <= 0) {
    alert('Informe o nome do produto e uma quantidade válida.');
    return;
  }

  const produto = await buscarProdutoPorNome(nome);
  if (!produto) {
    alert('Produto não encontrado.');
    return;
  }

  movimentarProduto(produto._id, tipo, qtd);

  // Limpar campos após movimentação
  document.getElementById('nomeProdutoMovimento').value = '';
  document.getElementById('qtdMovimento').value = '';
}

async function verHistorico(id) {
  try {
    const res = await fetch(`${apiURL}/${id}/historico`);
    const historico = await res.json();

    const lista = document.getElementById('listaHistorico');
    lista.innerHTML = '';

    if(historico.length === 0) {
      lista.innerHTML = '<li>Sem movimentações para este produto.</li>';
      return;
    }

    historico.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `Tipo: ${item.tipo}, Quantidade: ${item.quantidade}, Data: ${new Date(item.data).toLocaleString()}`;
      lista.appendChild(li);
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    alert('Erro ao buscar histórico.');
  }
}

// Nova função que busca pelo nome ao invés do id
async function verHistoricoPorNome() {
  const nome = document.getElementById('nomeProdutoHistorico').value.trim();
  if (!nome) {
    alert('Informe o nome do produto.');
    return;
  }

  const produto = await buscarProdutoPorNome(nome);
  if (!produto) {
    alert('Produto não encontrado.');
    return;
  }

  verHistorico(produto._id);

  // limpar campo após busca
  document.getElementById('nomeProdutoHistorico').value = '';
}

function mostrarSecao(idSecao) {
  const secoes = document.querySelectorAll('main > section');
  secoes.forEach(sec => sec.className = 'secao-oculta');
  const secaoAtiva = document.getElementById(idSecao);
  if (secaoAtiva) secaoAtiva.className = 'secao-visivel';
}

async function consultarSaldo() {
  const nomeBusca = document.getElementById('buscaNome').value.trim();
  const resultadoDiv = document.getElementById('resultadoSaldo');

  if (!nomeBusca) {
    resultadoDiv.innerHTML = '<p style="color: red;">Por favor, digite o nome do produto.</p>';
  } else {
    const produto = await buscarProdutoPorNome(nomeBusca);
    if (produto) {
      resultadoDiv.innerHTML = `
        <p>Produto: <strong>${produto.nome}</strong></p>
        <p>Quantidade em estoque: <strong>${produto.quantidade ?? 0}</strong></p>
      `;
    } else {
      resultadoDiv.innerHTML = '<p style="color: red;">Produto não encontrado.</p>';
    }
  }

  // Exibe todos os produtos em formato de tabela
  await exibirTodosProdutosNaSecaoSaldo();
}


async function exibirTodosProdutosNaSecaoSaldo() {
  try {
    const res = await fetch(apiURL);
    const produtos = await res.json();

    const tbody = document.querySelector('#tabelaTodosProdutos tbody');
    tbody.innerHTML = '';

    produtos.forEach(prod => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${prod.nome}</td>
        <td>${prod.quantidade ?? 0}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Erro ao carregar todos os produtos para exibição na seção de saldo:', error);
  }
}


async function exportarProdutos() {
  try {
    const res = await fetch(`${apiURL}/exportar`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'produtos.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (error) {
    alert('Erro ao exportar produtos.');
    console.error(error);
  }
}

async function importarProdutos() {
  const input = document.getElementById('arquivoImportacao');
  const file = input.files[0];
  if (!file) {
    alert('Selecione um arquivo!');
    return;
  }

  const formData = new FormData();
  formData.append('arquivo', file);

  try {
    const res = await fetch(`${apiURL}/importar`, {
      method: 'POST',
      body: formData
    });

    const result = await res.json();
    alert(result.message || 'Importação realizada!');
    carregarProdutos(); // atualiza tabela
  } catch (error) {
    alert('Erro ao importar produtos.');
    console.error(error);
  }
}
