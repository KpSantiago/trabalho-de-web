async function loadContrato(id) {
    const data = await fetch(`http://127.0.0.1:8000/contratos/${id}`);

    return data.json();
}


document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id) {
        console.error("ID do contrato não fornecido");
        window.location.href = "/trabalho-de-web/pages/contratos";
        alert("ID do contrato não fornecido");
        return;
    }

    loadContrato(id).then(contrato => {
        const dataAtual = new Date();
        const dataFim = new Date(contrato.data_fim);
        let diasRestantes = Math.ceil((dataFim - dataAtual) / (1000 * 60 * 60 * 24));
        diasRestantes = diasRestantes < 0 ? 0 : diasRestantes;

        document.querySelector('.value-rent').textContent = contrato.valor_aluguel;
        document.querySelector('.due-day').textContent = contrato.dia_vencimento;
        document.querySelector('.start-date').textContent = new Date(contrato.data_inicio).toLocaleDateString('pt-BR');
        document.querySelector('.end-date').textContent = dataFim.toLocaleDateString('pt-BR');
        document.querySelector('.id-contract').textContent = contrato.id;
        document.querySelector('.name-tenant').textContent = contrato.inquilino.nome;
        document.querySelector('.cpf-tenant').textContent = contrato.inquilino.cpf;
        document.querySelector('.phone-tenant').textContent = contrato.inquilino.telefone;
        document.querySelector('.name-property').textContent = contrato.imovel.apelido_imovel;
        document.querySelector('.address-property').textContent = contrato.imovel.endereco;
        document.querySelector('.status-property').textContent = contrato.imovel.status;

        document.querySelector('.badge').textContent = contrato.status;
        switch(contrato.status.toUpperCase()) {
            case 'CANCELADO':
            case 'ENCERRADO':
                document.querySelector('.badge').className = 'badge danger';
                break;
            default:
                document.querySelector('.badge').className = 'badge success';
                break;
        }

        const paragraph = document.querySelector('.days-left');
        paragraph.textContent = `Vence em ${diasRestantes} dias`;
        
        if (diasRestantes <= 30) {
            document.querySelector('.badge').className = 'badge warning';
            paragraph.style.color = 'var(--warning)';
        } else if (diasRestantes <= 0) {
            document.querySelector('.badge').className = 'badge danger';
            paragraph.style.color = 'var(--danger)';
        } else {
            document.querySelector('.badge').className = 'badge success';
            paragraph.style.color = 'var(--success)';
        }
    }).catch(error => {
        console.error("Erro ao carregar contrato: ", error);
    });
});
