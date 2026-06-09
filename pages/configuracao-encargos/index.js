const { getLoggedOwner } = window.AppSession;
const { requireOwnerOrRedirect } = window.AppPage;

async function sendRequest(data) {
    const response = await fetch(`http://127.0.0.1:8000/pagamentos/configurar-encargos/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    return response.json();
}

document.querySelector('form').addEventListener('submit',  (e) => {
    e.preventDefault();

    const proprietario = getLoggedOwner();
    
    if (!requireOwnerOrRedirect(proprietario, (message) => alert(message))) {
        return;
    }

    const data = {
        multa_percentual: document.querySelector('#multaPercentual').value,
        juros_mensal: document.querySelector('#jurosMora').value,
        tolerancia_dias: document.querySelector('#toleranciaDias').value,
        valor_minimo_multa: document.querySelector('#valorMinimoMulta').value,
        id_proprietario: proprietario.id
    };
    sendRequest(data).then(response => {
        alert("Configurações salvas com sucesso!");
    }).catch(() => {
        alert('Erro ao salvar configurações!');
    });
});
