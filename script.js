/**
 * Reflective Inquiry Sheet — Fiqih Lingkungan & Ekologi
 * Script: Interactivity, Auto-save, Print, Reset & Google Sheets Integration
 *
 * ============================================================
 * CARA SETTING GOOGLE SHEETS:
 * 1. Buka Google Sheets → buat sheet baru
 * 2. Klik Extensions → Apps Script
 * 3. Paste kode Google Apps Script (lihat file apps-script.gs)
 * 4. Deploy → New deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy URL deployment, paste di GOOGLE_SCRIPT_URL di bawah
 * ============================================================
 */

(function () {
  "use strict";

  // ============================================================
  // ⬇️ GANTI DENGAN URL GOOGLE APPS SCRIPT ANDA
  // ============================================================
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyVgkhZCKfMTFqpJrdEIBcQ7rBdi0EE9XupKBU8pxJTULeL-1Rk5ZAgZXGU3M7TS_kM/exec";
  // ============================================================

  const STORAGE_KEY = "ris_fiqih_lingkungan_v2";

  /* ── SLIDER ── */
  const slider    = document.getElementById("skala-slider");
  const skalaVal  = document.getElementById("skala-value");

  if (slider && skalaVal) {
    slider.addEventListener("input", () => {
      skalaVal.textContent = slider.value;
      saveToStorage();
    });
  }

  /* ── ADD ROW (Tabel Dalil) ── */
  const addRowBtn = document.getElementById("add-row-btn");
  const dalilBody = document.getElementById("dalil-body");

  if (addRowBtn && dalilBody) {
    addRowBtn.addEventListener("click", () => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><textarea class="cell-input" placeholder=""></textarea></td>
        <td><textarea class="cell-input" placeholder=""></textarea></td>
        <td><textarea class="cell-input" placeholder=""></textarea></td>
      `;
      dalilBody.appendChild(tr);
      tr.querySelectorAll(".cell-input").forEach((el) => {
        el.addEventListener("input", () => { autoResize(el); saveToStorage(); });
        autoResize(el);
      });
      saveToStorage();
    });
  }

  /* ── AUTO-RESIZE TEXTAREA ── */
  function autoResize(el) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  document.querySelectorAll("textarea").forEach((ta) => {
    ta.addEventListener("input", () => autoResize(ta));
    autoResize(ta);
  });

  /* ── LOCAL STORAGE SAVE ── */
  function collectData() {
    const data = {};

    document.querySelectorAll(".identity-input").forEach((el, i) => {
      data[`identity_${i}`] = el.value;
    });

    document.querySelectorAll("textarea").forEach((el, i) => {
      data[`textarea_${i}`] = el.value;
    });

    document.querySelectorAll('input[type="radio"]').forEach((el) => {
      if (el.checked) data[`radio_${el.name}`] = el.value;
    });

    if (slider) data["skala_slider"] = slider.value;
    if (dalilBody) data["dalil_rows"] = dalilBody.querySelectorAll("tr").length;

    return data;
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collectData()));
    } catch (e) {}
  }

  /* ── LOCAL STORAGE LOAD ── */
  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);

      document.querySelectorAll(".identity-input").forEach((el, i) => {
        if (data[`identity_${i}`] !== undefined) el.value = data[`identity_${i}`];
      });

      if (data["dalil_rows"] && dalilBody) {
        const current = dalilBody.querySelectorAll("tr").length;
        const target  = parseInt(data["dalil_rows"], 10);
        for (let i = current; i < target; i++) {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td><textarea class="cell-input"></textarea></td>
            <td><textarea class="cell-input"></textarea></td>
            <td><textarea class="cell-input"></textarea></td>
          `;
          dalilBody.appendChild(tr);
        }
        dalilBody.querySelectorAll(".cell-input").forEach((el) => {
          el.addEventListener("input", () => { autoResize(el); saveToStorage(); });
        });
      }

      document.querySelectorAll("textarea").forEach((el, i) => {
        if (data[`textarea_${i}`] !== undefined) {
          el.value = data[`textarea_${i}`];
          autoResize(el);
        }
      });

      document.querySelectorAll('input[type="radio"]').forEach((el) => {
        const key = `radio_${el.name}`;
        if (data[key] === el.value) el.checked = true;
      });

      if (slider && data["skala_slider"] !== undefined) {
        slider.value = data["skala_slider"];
        if (skalaVal) skalaVal.textContent = data["skala_slider"];
      }
    } catch (e) {}
  }

  /* ── ATTACH LISTENERS ── */
  function attachListeners() {
    document.querySelectorAll("textarea, .identity-input").forEach((el) => {
      el.addEventListener("input", saveToStorage);
    });
    document.querySelectorAll('input[type="radio"]').forEach((el) => {
      el.addEventListener("change", saveToStorage);
    });
  }

  /* ── TOAST NOTIFICATION ── */
  let toastTimer = null;
  function showToast(msg, isError = false) {
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toast-msg");
    if (!toast || !toastMsg) return;

    toastMsg.textContent = msg;
    toast.classList.toggle("toast-error", isError);
    toast.querySelector(".toast-icon").textContent = isError ? "✗" : "✓";
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 4000);
  }

  /* ── COLLECT SHEET DATA (untuk Google Sheets) ── */
  function collectSheetData() {
    // Kumpulkan baris dalil
    const dalilRows = [];
    if (dalilBody) {
      dalilBody.querySelectorAll("tr").forEach((tr, i) => {
        const cells = tr.querySelectorAll(".cell-input");
        if (cells.length === 3) {
          dalilRows.push({
            baris: i + 1,
            dalil_sumber: cells[0].value.trim(),
            dalil_makna:  cells[1].value.trim(),
            dalil_alasan: cells[2].value.trim(),
          });
        }
      });
    }

    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : "";
    };

    const getRadio = (name) => {
      const el = document.querySelector(`input[name="${name}"]:checked`);
      return el ? el.value : "";
    };

    return {
      // Identitas
      nama:              document.getElementById("id-nama")?.value.trim()    || "",
      nim:               document.getElementById("id-nim")?.value.trim()     || "",
      kelas:             document.getElementById("id-kelas")?.value.trim()   || "",
      tanggal:           document.getElementById("id-tanggal")?.value.trim() || "",

      // Bagian A
      a_respons_awal:    getVal("a_respons_awal"),
      a_asumsi:          getVal("a_asumsi"),

      // Bagian B — Dalil (disatukan jadi teks)
      b_dalil_tabel:     dalilRows.map((r, i) =>
        `[${i+1}] ${r.dalil_sumber} | ${r.dalil_makna} | ${r.dalil_alasan}`
      ).join("\n"),
      b_refleksi_dalil:  getVal("b_refleksi_dalil"),

      // Bagian C
      c_loop1_posisi:    getRadio("loop1_posisi"),
      c_loop1_argumen:   getVal("c_loop1_argumen"),
      c_loop2_asal:      getVal("c_loop2_asal"),
      c_loop3_salah:     getVal("c_loop3_salah"),

      // Bagian D
      d_khalifah:        getVal("d_khalifah"),
      d_ladhara:         getVal("d_ladhara"),
      d_hifzh:           getVal("d_hifzh"),
      d_nilai_custom:    getVal("d_nilai_custom_nama") + ": " + getVal("d_nilai_custom_isi"),
      d_komitmen:        getVal("d_komitmen"),

      // Bagian E
      e_ruang_bebas:     getVal("e_ruang_bebas"),

      // Bagian F
      f_skala_kejujuran: slider ? slider.value : "",
      f_alasan_skala:    getVal("f_alasan_skala"),
      f_sumber_belajar:  getVal("f_sumber_belajar"),
      f_pertanyaan:      getVal("f_pertanyaan"),
    };
  }

  /* ── VALIDASI WAJIB ── */
  function validate() {
    const nama  = document.getElementById("id-nama")?.value.trim();
    const kelas = document.getElementById("id-kelas")?.value.trim();
    if (!nama) {
      showToast("Harap isi Nama terlebih dahulu.", true);
      document.getElementById("id-nama")?.focus();
      return false;
    }
    if (!kelas) {
      showToast("Harap isi Kelas terlebih dahulu.", true);
      document.getElementById("id-kelas")?.focus();
      return false;
    }
    return true;
  }

  /* ── KIRIM KE GOOGLE SHEETS ── */
  async function submitToSheets() {
    if (!validate()) return;

    // Cek apakah URL sudah diganti
    if (
      GOOGLE_SCRIPT_URL === "https://script.google.com/macros/s/AKfycbyVgkhZCKfMTFqpJrdEIBcQ7rBdi0EE9XupKBU8pxJTULeL-1Rk5ZAgZXGU3M7TS_kM/exec" ||
      !GOOGLE_SCRIPT_URL.startsWith("https://script.google.com")
    ) {
      showToast("URL Google Apps Script belum diisi di script.js!", true);
      return;
    }

    const btnSubmit   = document.getElementById("btn-submit");
    const statusBox   = document.getElementById("submit-status");
    const statusText  = document.getElementById("status-text");
    const statusSpinner = document.getElementById("status-spinner");

    btnSubmit.disabled = true;
    btnSubmit.querySelector(".btn-text").textContent = "Mengirim...";
    statusBox.style.display = "block";
    statusText.textContent  = "Mengirim jawaban Anda ke Google Sheets...";

    const data = collectSheetData();

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method:  "POST",
        mode:    "no-cors",   // Google Apps Script membutuhkan no-cors
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });

      // no-cors tidak mengembalikan respons body — anggap sukses jika tidak error
      statusSpinner.style.display = "none";
      statusText.textContent = "✓ Jawaban berhasil terkirim! Jazakallahu khairan.";
      statusText.style.color = "var(--accent-green)";
      showToast("Jawaban berhasil tersimpan di Google Sheets!");

      // Tandai sudah terkirim di localStorage
      saveToStorage();

    } catch (err) {
      statusSpinner.style.display = "none";
      statusText.textContent = "✗ Gagal mengirim. Periksa koneksi internet Anda.";
      statusText.style.color = "var(--accent-rust)";
      showToast("Gagal mengirim. Cek koneksi internet.", true);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.querySelector(".btn-text").textContent = "Kirim Jawaban";
    }
  }

  /* ── TOMBOL SUBMIT ── */
  const btnSubmit = document.getElementById("btn-submit");
  if (btnSubmit) {
    btnSubmit.addEventListener("click", submitToSheets);
  }

  /* ── TOMBOL CETAK ── */
  const btnPrint = document.getElementById("btn-print");
  if (btnPrint) {
    btnPrint.addEventListener("click", () => {
      saveToStorage();
      window.print();
    });
  }

  /* ── TOMBOL RESET ── */
  const btnReset = document.getElementById("btn-reset");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      const ok = window.confirm("Reset akan menghapus semua isian Anda. Lanjutkan?");
      if (!ok) return;

      document.querySelectorAll("textarea, .identity-input").forEach((el) => {
        el.value = "";
        autoResize(el);
      });

      document.querySelectorAll('input[type="radio"]').forEach((el) => {
        el.checked = false;
      });

      if (slider)   slider.value = 5;
      if (skalaVal) skalaVal.textContent = "5";

      if (dalilBody) {
        dalilBody.querySelectorAll("tr").forEach((row, i) => {
          if (i >= 3) row.remove();
        });
      }

      const statusBox = document.getElementById("submit-status");
      if (statusBox) statusBox.style.display = "none";

      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      showToast("Form berhasil direset.");
    });
  }

  /* ── REVEAL ANIMATION ── */
  function initReveal() {
    if (!("IntersectionObserver" in window)) return;
    const sections = document.querySelectorAll(".bagian");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 }
    );
    sections.forEach((s) => {
      s.style.opacity   = "0";
      s.style.transform = "translateY(18px)";
      s.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      observer.observe(s);
    });
  }

  /* ── INIT ── */
  function init() {
    attachListeners();
    loadFromStorage();
    initReveal();
    document.querySelectorAll("textarea").forEach((ta) => autoResize(ta));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
