const CHAVE_CHECKLISTS = "checklist_app_checklists_v1";
const CHAVE_CONFIG = "checklist_app_config_v1";
const LOGO_PADRAO = "icons/icon.svg";

let checklists = JSON.parse(localStorage.getItem(CHAVE_CHECKLISTS) || "[]");
let config = JSON.parse(localStorage.getItem(CHAVE_CONFIG) || JSON.stringify({
  empresa: "Minha Empresa",
  funcionario: "Funcionário",
  logo: ""
}));

const $ = (id) => document.getElementById(id);

function hojeBR() {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  }).format(new Date());
}

function dataISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dia}`;
}

function formatarData(iso) {
  if (!iso) return "";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function salvarDados() {
  localStorage.setItem(CHAVE_CHECKLISTS, JSON.stringify(checklists));
}

function salvarConfigLocal() {
  localStorage.setItem(CHAVE_CONFIG, JSON.stringify(config));
}

function aplicarConfig() {
  $("empresaHeader").textContent = config.empresa || "Minha Empresa";
  $("funcionarioHeader").textContent = config.funcionario || "Funcionário";
  const logo = config.logo || LOGO_PADRAO;
  $("logoHeader").src = logo;
  $("logoPreview").src = logo;
  $("nomeEmpresa").value = config.empresa || "";
  $("nomeFuncionario").value = config.funcionario || "";
}

function adicionarAtividade(dados = {}) {
  const template = $("atividadeTemplate");
  const clone = template.content.cloneNode(true);
  const card = clone.querySelector(".activity");

  card.querySelector(".atividade-texto").value = dados.texto || "";
  card.querySelector(".atividade-hora").value = dados.hora || "";
  card.querySelector(".atividade-ok").checked = !!dados.ok;

  card.querySelector(".remove-btn").addEventListener("click", () => {
    card.remove();
    numerarAtividades();
    atualizarVazio();
  });

  $("listaAtividades").appendChild(card);
  numerarAtividades();
  atualizarVazio();
}

function numerarAtividades() {
  document.querySelectorAll("#listaAtividades .activity").forEach((card, i) => {
    card.querySelector(".activity-number").textContent = i + 1;
  });
}

function atualizarVazio() {
  $("semAtividades").style.display =
    document.querySelectorAll("#listaAtividades .activity").length ? "none" : "flex";
}

function coletarAtividades() {
  return [...document.querySelectorAll("#listaAtividades .activity")].map(card => ({
    texto: card.querySelector(".atividade-texto").value.trim(),
    hora: card.querySelector(".atividade-hora").value,
    ok: card.querySelector(".atividade-ok").checked
  }));
}

function salvarChecklist() {
  const area = $("area").value.trim();
  const observacao = $("observacaoGeral").value.trim();
  const atividades = coletarAtividades();

  if (!area) {
    alert("Informe a área antes de salvar.");
    $("area").focus();
    return;
  }
  if (!atividades.length) {
    alert("Adicione pelo menos uma atividade.");
    return;
  }
  if (atividades.some(a => !a.texto)) {
    alert("Preencha a descrição de todas as atividades.");
    return;
  }

  const checklist = {
    id: Date.now(),
    data: dataISO(),
    dataHora: new Date().toISOString(),
    area,
    observacao,
    funcionario: config.funcionario || "Funcionário",
    empresa: config.empresa || "Minha Empresa",
    atividades
  };

  checklists.unshift(checklist);
  salvarDados();

  $("area").value = "";
  $("observacaoGeral").value = "";
  $("listaAtividades").innerHTML = "";
  atualizarVazio();

  alert("Checklist salvo com sucesso!");
  abrirAba("abaHistorico");
  renderHistorico();
}

function renderHistorico() {
  const filtroData = $("filtroData").value;
  const busca = $("filtroBusca").value.toLowerCase().trim();

  const lista = checklists.filter(c => {
    const dataOk = !filtroData || c.data === filtroData;
    const texto = `${c.area} ${c.observacao} ${c.atividades.map(a => a.texto).join(" ")}`.toLowerCase();
    return dataOk && (!busca || texto.includes(busca));
  });

  const container = $("listaHistorico");
  container.innerHTML = "";
  $("historicoVazio").style.display = lista.length ? "none" : "flex";

  lista.forEach(c => {
    const card = document.createElement("div");
    card.className = "card history-card";
    const total = c.atividades.length;
    const concluidas = c.atividades.filter(a => a.ok).length;
    card.innerHTML = `
      <div class="history-top">
        <div>
          <div class="history-title">${escapeHtml(c.area)}</div>
          <div class="history-meta">${formatarData(c.data)} • ${escapeHtml(c.funcionario || "Funcionário")}</div>
        </div>
        <span class="status">${concluidas}/${total} OK</span>
      </div>
      <div class="history-bottom">${total} atividade(s) • Clique para ver detalhes</div>
    `;
    card.addEventListener("click", () => abrirDetalhes(c));
    container.appendChild(card);
  });
}

function abrirDetalhes(c) {
  $("modalTitulo").textContent = `${c.area} — ${formatarData(c.data)}`;
  $("modalConteudo").innerHTML = `
    <p><strong>Funcionário:</strong> ${escapeHtml(c.funcionario || "Funcionário")}</p>
    <p><strong>Empresa:</strong> ${escapeHtml(c.empresa || "")}</p>
    ${c.observacao ? `<p><strong>Observação:</strong> ${escapeHtml(c.observacao)}</p>` : ""}
    <h4>Atividades</h4>
    ${c.atividades.map((a, i) => `
      <div class="detail-line">
        <strong>${i + 1}. ${escapeHtml(a.texto)}</strong>
        <span>${a.hora ? `Horário: ${escapeHtml(a.hora)} • ` : ""}<span class="${a.ok ? "ok" : ""}">${a.ok ? "✓ OK — concluído" : "Pendente"}</span></span>
      </div>
    `).join("")}
  `;
  $("modalDetalhes").classList.add("aberto");
  $("modalDetalhes").setAttribute("aria-hidden", "false");
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function abrirAba(id) {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("ativa"));
  $(id).classList.add("ativa");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("ativo", b.dataset.aba === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$("dataAtual").textContent = hojeBR();
$("btnAdicionar").addEventListener("click", () => adicionarAtividade());
$("btnSalvar").addEventListener("click", salvarChecklist);
$("filtroData").addEventListener("input", renderHistorico);
$("filtroBusca").addEventListener("input", renderHistorico);

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => abrirAba(btn.dataset.aba));
});
$("btnConfig").addEventListener("click", () => abrirAba("abaConfig"));

$("btnSalvarConfig").addEventListener("click", () => {
  config.empresa = $("nomeEmpresa").value.trim() || "Minha Empresa";
  config.funcionario = $("nomeFuncionario").value.trim() || "Funcionário";
  salvarConfigLocal();
  aplicarConfig();
  alert("Personalização salva!");
});

$("logoInput").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Selecione uma imagem.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    config.logo = reader.result;
    salvarConfigLocal();
    aplicarConfig();
  };
  reader.readAsDataURL(file);
});

$("btnRemoverLogo").addEventListener("click", () => {
  config.logo = "";
  $("logoInput").value = "";
  salvarConfigLocal();
  aplicarConfig();
});

$("btnApagarTudo").addEventListener("click", () => {
  if (!checklists.length) {
    alert("Não há checklists para apagar.");
    return;
  }
  if (confirm("Tem certeza que deseja apagar TODOS os checklists deste dispositivo? Essa ação não pode ser desfeita.")) {
    checklists = [];
    salvarDados();
    renderHistorico();
    alert("Todos os checklists foram apagados.");
  }
});

$("fecharModal").addEventListener("click", () => {
  $("modalDetalhes").classList.remove("aberto");
  $("modalDetalhes").setAttribute("aria-hidden", "true");
});

$("modalDetalhes").addEventListener("click", e => {
  if (e.target === $("modalDetalhes")) $("fecharModal").click();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

aplicarConfig();
atualizarVazio();
renderHistorico();
