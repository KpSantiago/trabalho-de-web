const { getLoggedOwner } = window.AppSession;
const { requireOwnerOrRedirect } = window.AppPage;

// METRICAS DE PAGAMENTOS
async function loadMetrics() {
    const proprietario = getLoggedOwner();
    
    if (!requireOwnerOrRedirect(proprietario, (message) => console.error(message))) {
        return;
    }

    const response = await fetch(`http://127.0.0.1:8000/pagamentos/metrics/geral?id_proprietario=${proprietario.id}`);
    
    return response.json();
}

loadMetrics().then(data => {
    document.getElementById('pending-count').textContent = data.pendentes;
    document.getElementById('paid-this-month').textContent = data.pagos_mes;
    document.getElementById('overdue-count').textContent = data.atrasados;
}).catch(error => {
    console.error('Erro ao carregar métricas:', error);
});

// TABELA DE PAGAMENTOS
async function loadPayments() {
    const proprietario = getLoggedOwner();
    
    if (!requireOwnerOrRedirect(proprietario, (message) => console.error(message))) {
        return;
    }

    const response = await fetch(`http://127.0.0.1:8000/pagamentos?id_proprietario=${proprietario.id}`);
    
    return response.json();
}

loadPayments().then(data => {
    const tbody = document.querySelector('.pagamentos-tboy');

    for (pagamento of data) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${pagamento.numero_parcela}</td>
            <td>${pagamento.inquilino.nome}</td>
            <td>${pagamento.imovel.apelido_imovel} - ${pagamento.imovel.endereco}</td>
            <td>${new Date(pagamento.data_vencimento).toLocaleDateString('pt-BR')}</td>
            <td>${pagamento.valor_original.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td>${pagamento.multa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td>${pagamento.juros.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td>${pagamento.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td><span class="badge ${pagamento.status === 'Pago' ? 'success' : pagamento.status === 'Atrasado' ? 'error' : 'warning'}">${pagamento.status}</span></td>
            <td><a class="btn btn-secondary btn-small" href="../pagamento/?id=${pagamento.id}">Acessar</a></td>
        `;
        tbody.appendChild(row);
    }
}).catch(error => {
    console.error('Erro ao carregar pagamentos:', error);
});

