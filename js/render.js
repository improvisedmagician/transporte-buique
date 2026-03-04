import { db, Storage } from './storage.js';
import { ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const Render = {
    // 1. Renderiza a tabela e CONTA as pessoas (Respeitando filtros)
    transportTable() {
        const tableBody = document.getElementById('transport-table-body');
        const selectedSchool = document.getElementById('filter-school') ? document.getElementById('filter-school').value : 'all';
        const badge = document.getElementById('count-badge');
        
        const listRef = ref(db, `transporte_escolar`);

        onValue(listRef, (snapshot) => {
            if (!tableBody) return;
            tableBody.innerHTML = '';
            let total = 0;

            if (snapshot.exists()) {
                const allDates = snapshot.val();
                const sortedDates = Object.keys(allDates).sort().reverse();

                sortedDates.forEach(date => {
                    const entries = allDates[date];
                    Object.entries(entries).forEach(([id, data]) => {
                        
                        // Incrementa o contador se passar pelo filtro
                        if (selectedSchool === 'all' || data.school === selectedSchool) {
                            total++;
                            
                            tableBody.innerHTML += `
                                <tr class="hover:bg-blue-50/30 transition-colors border-b border-slate-50">
                                    <td class="px-8 py-5">
                                        <div class="text-sm font-extrabold text-slate-800 uppercase tracking-tight">${data.name}</div>
                                        <div class="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-0.5">${data.school}</div>
                                        <div class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5"><i class="fas fa-graduation-cap"></i> ${data.serie || 'Série não informada'}</div>
                                    </td>
                                    <td class="px-8 py-5">
                                        <div class="text-xs font-bold text-slate-700 uppercase"><i class="fas fa-id-badge text-slate-400 mr-1"></i> ${data.motorista || 'N/A'}</div>
                                        <div class="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5"><i class="fas fa-clock text-slate-300 mr-1"></i> ${data.turno || 'N/A'}</div>
                                    </td>
                                    <td class="px-8 py-5 text-center">
                                        <div class="inline-flex flex-col bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/50">
                                            <span class="text-xs font-bold text-slate-700">${date.split('-').reverse().join('/')}</span>
                                            <span class="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">${data.time}</span>
                                        </div>
                                    </td>
                                    <td class="px-8 py-5 text-center">
                                        <button onclick="window.Render.deleteEntry('${date}/${id}')" class="w-9 h-9 rounded-full text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center mx-auto">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </td>
                                </tr>`;
                        }
                    });
                });
            }

            if (total === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="py-24 text-center text-slate-300 font-medium italic">Nenhum registo encontrado.</td></tr>';
            }

            // ATUALIZA A CONTAGEM NA TELA
            if (badge) {
                badge.classList.remove('animate-pulse');
                badge.textContent = `${total} ${total === 1 ? 'PESSOA RESPONDEU' : 'PESSOAS RESPONDERAM'}`;
            }
        });
    },

    // 2. Exportação Customizada por Escola
    async exportToCSV() {
        const selectedSchool = document.getElementById('filter-school').value;
        const snapshot = await get(ref(db, `transporte_escolar`));
        
        if (!snapshot.exists()) return alert("Nada para exportar.");

        // Cabeçalho atualizado com a coluna Série
        let csv = "\uFEFFData;Hora;Nome;Escola;Série;Turno;Motorista\n";
        const allDates = snapshot.val();
        let contagemExport = 0;

        Object.keys(allDates).sort().forEach(date => {
            Object.values(allDates[date]).forEach(item => {
                if (selectedSchool === 'all' || item.school === selectedSchool) {
                    csv += `${date.split('-').reverse().join('/')};${item.time};${item.name};${item.school};${item.serie || ''};${item.turno || ''};${item.motorista || ''}\n`;
                    contagemExport++;
                }
            });
        });

        if (contagemExport === 0) return alert("Nenhum dado encontrado para esta escola.");

        const prefixo = selectedSchool === 'all' ? "GERAL" : selectedSchool.replace(/\s+/g, '_').toUpperCase();
        const nomeArquivo = `TRANSPORTE_BUIQUE_${prefixo}.csv`;

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = nomeArquivo;
        link.click();
    },

    // 3. Funções Auxiliares de Gerenciamento
    async schoolListAdmin() {
        const container = document.getElementById('school-list-container');
        if (!container) return;
        const schools = await Storage.getSchools();
        container.innerHTML = '';
        schools.forEach(school => {
            container.innerHTML += `
                <div class="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 group hover:border-blue-200 hover:bg-white transition-all">
                    <span class="text-[11px] font-bold text-slate-600 truncate mr-2 uppercase">${school}</span>
                    <button onclick="window.Render.deleteSchool('${school}')" class="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <i class="fas fa-times-circle text-lg"></i>
                    </button>
                </div>`;
        });
    },

    async updateSchoolFilter() {
        const filterSelect = document.getElementById('filter-school');
        if (!filterSelect) return;
        const schools = await Storage.getSchools();
        filterSelect.innerHTML = '<option value="all">TODAS AS ESCOLAS (GERAL)</option>';
        schools.forEach(school => {
            filterSelect.innerHTML += `<option value="${school}">${school.toUpperCase()}</option>`;
        });
    },

    async deleteEntry(path) {
        if(confirm("Excluir este passageiro definitivamente?")) {
            await Storage.deleteTransportEntry(path);
        }
    },

    async deleteSchool(name) {
        if(confirm(`Remover "${name}" da lista oficial?`)) {
            await Storage.deleteSchool(name);
            this.schoolListAdmin();
            this.updateSchoolFilter();
        }
    }
};

export { Render };