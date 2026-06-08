// INQUILINOS
async function loadInquilinos() {
    const dados = await fetch("http://127.0.0.1:8000/inquilinos/");

    return await dados.json();
}

async function loadInquilinoById(id) {
    const dados = await fetch(`http://127.0.0.1:8000/inquilinos/${id}/`);

    return await dados.json();
}

const select = document.querySelector('select#inquilino');
loadInquilinos().then((dados) => {
    dados.forEach((inquilino) => {
        const option = document.createElement('option');
        option.value = inquilino.id;
        option.textContent = inquilino.nome;
        select.appendChild(option);
    });
});

select.addEventListener('change', () => {
    loadInquilinoById(select.value).then((dados) => {
        document.querySelector('#cpf').value = dados.cpf;
    });
});


// IMÓVEIS
async function loadImoveis() {
    const dados = await fetch("http://127.0.0.1:8000/imoveis/");

    return await dados.json();
}

async function loadImovelById(id) {
    const dados = await fetch(`http://127.0.0.1:8000/imoveis/${id}/`);

    return await dados.json();
}

const selectImovel = document.querySelector('select#imovel');
loadImoveis().then((dados) => {
    dados.forEach((imovel) => {
        const option = document.createElement('option');
        option.value = imovel.id;
        option.textContent = imovel.endereco;
        selectImovel.appendChild(option);
    });
});

selectImovel.addEventListener('change', () => {
    loadImovelById(selectImovel.value).then((dados) => {
        document.querySelector('#endereco').value = dados.endereco;
    });
});


// FORMULÁRIO
async function sendRequest(formData) {
    const response = await fetch("http://127.0.0.1:8000/contratos/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    });

    return response.json();
}

const form = document.querySelector('form.contract-form');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitBtn = document.querySelector(".submit-btn");
    submitBtn.setAttribute("disabled", "true");

    const formData = {
        id_inquilino: select.value,
        id_imovel: selectImovel.value,
        data_inicio: document.querySelector('#dataInicio').value,
        data_fim: document.querySelector('#dataVencimento').value,
        valor_aluguel: parseFloat(document.querySelector('#valorAluguel').value),
        dia_vencimento: parseInt(document.querySelector('#diaVencimento').value),
    };

    sendRequest(formData).then((response) => {
        if (response.ok)
            alert("Contrato criado com sucesso!");
        else
            alert(response.detail);
    }).catch((error) => {
        console.error(error);
        alert("Erro ao criar contrato!");
    }).finally(() => {
        submitBtn.removeAttribute("disabled");
    });
});

