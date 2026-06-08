// Métricas
async function loadMetricas() {
    const data = await fetch("http://127.0.0.1:8000/contratos/metrics/geral");
    
    return await data.json();
}

loadMetricas().then(metricas => {
    document.querySelector('.ativos .number').textContent = metricas.contratos_ativos;
    document.querySelector('.disponiveis .number').textContent = metricas.imoveis_disponiveis;
    document.querySelector('.vencendo .number').textContent = metricas.contratos_vencendo;
}).catch(error => {
    document.querySelector('.ativos .number').textContent = '0';
    document.querySelector('.disponiveis .number').textContent = '0';
    document.querySelector('.vencendo .number').textContent = '0';

    console.error("Erro ao carregar métricas: ", error);
});

// TABELA - listagem de contratos
async function loadContratos() {
    const data = await fetch("http://127.0.0.1:8000/contratos");

    return await data.json();
}

loadContratos().then(contratos => {
    const tbody = document.querySelector('.contratos-tbody');

    if (contratos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">Nenhum contrato fechado</td></tr>';
        return;
    }
    
    for (const contrato of contratos) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${contrato.id}</td>
            <td>${contrato.inquilino.nome}</td>
            <td>${contrato.imovel.apelido_imovel} - ${contrato.imovel.endereco}</td>
            <td>${contrato.valor_aluguel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td>${new Date(contrato.data_inicio).toLocaleDateString('pt-BR')}</td>
            <td>${new Date(contrato.data_fim).toLocaleDateString('pt-BR')}</td>
            <td><span class="badge ${contrato.status === 'Ativo' ? 'success' : contrato.status === 'Encerrado' ? 'warning' : 'error'}">${contrato.status}</span></td>
            <td><a class="btn btn-secondary btn-small" href="../contrato/?id=${contrato.id}">Acessar</a>
            </td>
        `;
        tbody.appendChild(row);
    }
}).catch(error => {
    document.querySelector('.contratos-tbody').innerHTML = '<tr><td colspan="8">Erro ao carregar contratos</td></tr>';
    
    console.error("Erro ao carregar contratos: ", error);
});
