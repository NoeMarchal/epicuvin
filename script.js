const API_URL = "https://script.google.com/macros/s/AKfycby-5JOj5W_TZsuBkMWLKiWK9wVqt-d_Dib_Zo_kgaJKDgVLULJSBuHzjD1l6mQJDWuFtQ/exec";

const form = document.getElementById("wine-form");
const tableBody = document.getElementById("wine-table-body");
let wineData = [];
let currentSort = { key: "", asc: true };
let currentSearch = "";

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast${isError ? " error" : ""}`;
  toast.style.display = "block";

  setTimeout(() => {
    toast.classList.add("hide");
  }, 2500);

  setTimeout(() => {
    toast.style.display = "none";
    toast.classList.remove("hide", "error");
  }, 3000);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("wine-id").value;
  const nom = document.getElementById("name").value;
  const annee = document.getElementById("year").value;
  const quantite = document.getElementById("quantity").value;
  const region = document.getElementById("region").value;
  const commentaire = document.getElementById("commentaire").value;

  const wine = { nom, annee, quantite, region, commentaire };
  wine.action = id ? "edit" : "add";
  if (id) wine.id = id;

  document.getElementById("loader").style.display = "block";

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(wine),
  });

  document.getElementById("loader").style.display = "none";
  form.reset();
  document.getElementById("wine-id").value = "";
  await loadWines();
  showToast(id ? "Vin modifié avec succès 🍷" : "Vin ajouté avec succès 🍇");
  
});

async function loadWines() {
  const res = await fetch(API_URL);
  wineData = await res.json();
  applySorting();
}

function applySorting() {
  if (currentSort.key) {
    wineData.sort((a, b) => {
      const valA = a[currentSort.key] || "";
      const valB = b[currentSort.key] || "";

      if (!isNaN(valA) && !isNaN(valB)) {
        return currentSort.asc ? valA - valB : valB - valA;
      }

      return currentSort.asc
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    });
  }

  renderTable();
  updateHeaderArrows();
}

function renderTable() {
  tableBody.innerHTML = "";

  const filtered = wineData.filter(wine => {
    const combined = `${wine.nom} ${wine.annee} ${wine.quantite} ${wine.region} ${wine.commentaire}`.toLowerCase();
    return combined.includes(currentSearch.toLowerCase());
  });

  filtered.forEach(wine => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${wine.nom}</td>
      <td>${wine.annee}</td>
      <td>${wine.quantite}</td>
      <td>${wine.region}</td>
      <td>${wine.commentaire || ""}</td>
      <td>
        <button class="edit-btn" data-id='${wine.id}'>✏️</button>
        <button class="delete-btn" data-id='${wine.id}'>🗑️</button>
      </td>
    `;
    row.dataset.wine = JSON.stringify(wine);
    tableBody.appendChild(row);
  });

  tableBody.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const wine = JSON.parse(e.target.closest("tr").dataset.wine);
      editWine(wine);
    });
  });

  tableBody.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (confirm("Supprimer ce vin ?")) {
        document.getElementById("loader").style.display = "block";
        await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify({ action: "delete", id }),
        });
        e.target.closest("tr").remove();
        showToast("Vin supprimé avec succès ❌");
        document.getElementById("loader").style.display = "none";
      }
    });
  });
}

function updateHeaderArrows() {
  document.querySelectorAll("th[data-key]").forEach(th => {
    const key = th.dataset.key;
    let label = th.textContent.replace(/[\u2191\u2193]/g, "").trim();

    if (key === currentSort.key) {
      label += currentSort.asc ? " ↑" : " ↓";
    }

    th.textContent = label;
  });
}

function editWine(wine) {
  document.getElementById("wine-id").value = wine.id;
  document.getElementById("name").value = wine.nom;
  document.getElementById("year").value = wine.annee;
  document.getElementById("quantity").value = wine.quantite;
  document.getElementById("region").value = wine.region;
  document.getElementById("commentaire").value = wine.commentaire || "";
}

// Tri au clic sur les th
document.querySelectorAll("th[data-key]").forEach(th => {
  th.style.cursor = "pointer";
  th.addEventListener("click", () => {
    const key = th.dataset.key;
    const isAsc = currentSort.key === key ? !currentSort.asc : true;
    currentSort = { key, asc: isAsc };
    applySorting();
  });
});

// Recherche globale
document.getElementById("search-bar").addEventListener("input", (e) => {
  currentSearch = e.target.value;
  renderTable();
});
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.clear(); // ou localStorage.removeItem("user");
  sessionStorage.clear(); // ou sessionStorage.removeItem("user");
  window.location.href = "index.html";
});

loadWines();

