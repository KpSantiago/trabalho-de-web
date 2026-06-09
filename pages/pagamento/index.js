const { getLoggedOwner } = window.AppSession;
const { requireOwnerOrRedirect } = window.AppPage;

async function loadPagamento(id) {
    const response = await fetch(`http://127.0.0.1:8000/pagamentos/${id}`);
  
    return response.json();
}


window.addEventListener('DOMContentLoaded', () => {
    const proprietario = getLoggedOwner();
    
    if (!requireOwnerOrRedirect(proprietario)) {
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        window.location.href = '../pagamentos/';
        alert('ID do pagamento não fornecido');
        return;
    }
    
    loadPagamento(id).then(pagamento => {
        const diasAtraso = Math.floor((new Date() - new Date(pagamento.data_vencimento)) / (1000 * 60 * 60 * 24))

        document.querySelector('#nome-inquilino').textContent = pagamento.inquilino.nome;
        document.querySelector('#cpf-inquilino').textContent = pagamento.inquilino.cpf;
        document.querySelector('#telefone-inquilino').textContent = pagamento.inquilino.telefone;
        document.querySelector('#imovel').textContent = pagamento.imovel.apelido_imovel;
        document.querySelector('#endereco').textContent = pagamento.imovel.endereco;
        document.querySelector('#parcela').textContent = pagamento.numero_parcela;
        document.querySelector('#vencimento').textContent = new Date(pagamento.data_vencimento).toLocaleDateString('pt-BR');
        document.querySelector('#valor-original').textContent = pagamento.valor_original.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.querySelector('#multa').textContent = pagamento.multa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.querySelector('#juros').textContent = pagamento.juros.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.querySelector('#valor-total').textContent = pagamento.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const status = document.querySelector('#status');
        status.textContent = pagamento.status.toUpperCase();

        const pAtraso = document.querySelector('#dias-atraso');
        pAtraso.textContent = diasAtraso > 0 ? diasAtraso + ' dias de atraso' : Math.abs(diasAtraso) + ' dias até a data de vencimento';

        if (diasAtraso > 0) {
            status.classList.add('error');
            pAtraso.style.color = 'var(--error)';
        } else {
            status.classList.add('success');
            pAtraso.style.color = 'var(--success)';
        }

    }).catch(error => {
        console.error('Error loading pagamento:', error);
    });
})