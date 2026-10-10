// ==UserScript==
// @name         Easy-Irodori-TTS(ローカル環境版) 拡張機能
// @namespace    https://github.com/grmpnk
// @version      Easy-Irodori-TTS-v1.1
// @description  無料の音声生成AIの拡張機能 - ショートカットの追加/ファイル名を指定/演出の一括表示/テンプレート機能を追加
// @author       grmpneko
// @match        http://127.0.0.1:7860/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=127.0.0.1
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM_download
// @license      MIT
// ==/UserScript==
// ==========================================
// ユーティリティ/ファクトリ関数
// ==========================================
let w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window, d = document
let $S = s => document.querySelector(s), $SA = s => document.querySelectorAll(s);
let $C = (tag, { attrs = {}, props = {}, styles = {}, on = {} } = {}) => {//属性、プロパティ、スタイル、イベント
    const el = document.createElement(tag);
    for(const [name, value] of Object.entries(attrs)){
        if(value === false || value == null) continue;
        if(value === true){
            el.setAttribute(name, "");
        }else el.setAttribute(name, String(value));
    }
    Object.assign(el, props); Object.assign(el.style, styles);
    for(const [ev, handler] of Object.entries(on)){
        if(typeof handler === "function") el.addEventListener(ev, handler);
    }
    return el;
};
// ==========================================
// ショートカット
// ==========================================
function updatePlaceholder(){
    let el = $S('[placeholder="どうもおばんでした。今日はどんな一日でしたか？"]')

    if (el) { el.placeholder += "\n' / ' キーでショートカット"; el.id = "grmp-Textarea"; }
    else {
        const observer = new MutationObserver((mutations, obs) => {
            el = $S('[placeholder="どうもおばんでした。今日はどんな一日でしたか？"]')
            if (el) {
                obs.disconnect();
                el.placeholder += "\n' / ' キーでここにショートカット"
                el.id = "grmp-Textarea";
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    }
}updatePlaceholder()

addEventListener('keydown', e => {
    if(e.key == '/'){

        let el = $S(`[placeholder="どうもおばんでした。今日はどんな一日でしたか？\\a ' / ' キーでここにショートカット"]`);
        if (!el) return;
        if (d.activeElement === el) return;

        let activeTag = d.activeElement.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || d.activeElement.isContentEditable) return;

        e.preventDefault(); el.focus();
    }
    if (e.key === 'Enter' && e.shiftKey) { $S('.lg.primary.svelte-xzq5jh').click(); }
});

// 音声生成
function speechGeneration(){
    let el = $S('.lg.primary.svelte-xzq5jh')

    if (el) { el.textContent += "  （Shift+Enter）"; }
    else {
        const observer = new MutationObserver((mutations, obs) => {
            el = $S('.lg.primary.svelte-xzq5jh')
            if (el) {
                obs.disconnect();
                el.textContent += "  （Shift+Enter）";
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    }
}speechGeneration()
// ==========================================
// File名を指定
// ==========================================
const processDownloadLink = (link) => {
    if (!link.href) return;

    const targetParent = link.parentElement.parentElement;
    if (!targetParent) return;

    if (targetParent.querySelector('.custom-dl-container') || d.querySelector('.custom-dl-container')) { return; }

    const speechUrl = link.href;
    const uiContainer = $C('div', {
        props: { className: 'custom-dl-container' },
        styles: { display: 'flex', gap: '8px', alignItems: 'center', width: '100%', boxSizing: 'border-box', marginTop: '10px', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }
    });

    // ファイル名入力フィールド
    const nameInput = $C('input', {
        attrs: { type: 'text', placeholder: 'ファイル名を入力' },
        styles: { padding: '4px 8px', flex: '1', minWidth: '0', boxSizing: 'border-box', backgroundColor: '#3f3f46', color: '#ffffff', border: '1px solid #52525b', borderRadius: '4px', fontFamily: 'inherit', fontSize: 'inherit', outline: 'none' }
    });

    // テキストボタン
    const textBtn = $C('button', {
        props: { textContent: 'テキスト' },
        styles: { padding: '4px 8px', cursor: 'pointer', whiteSpace: 'nowrap' },
        on: {
            click: (e) => {
                e.preventDefault();
                const sourceInput = $S('#grmp-Textarea');
                if(sourceInput) {
                    const cleanedText = sourceInput.value.replace(/[\s\u3000]+/g, '');
                    nameInput.value = cleanedText;
                } else {
                }
            }
        }
    });

    // 保存ボタン
    const saveBtn = $C('button', {
        props: { textContent: '保存' },
        styles: { padding: '4px 8px', cursor: 'pointer', whiteSpace: 'nowrap' },
        on: {
            click: (e) => {
                e.preventDefault();
                let filename = nameInput.value || 'grmpneko_audio';

                if (!filename.match(/\.[a-zA-Z0-9]+$/)) { filename += '.wav'; }

                GM_download({
                    url: speechUrl,
                    name: filename,
                    saveAs: true,
                    onload: () => console.log('ダウンロード完了:', filename),
                    onerror: (err) => console.log('ダウンロード失敗:', err)
                });
            }
        }
    });
    uiContainer.appendChild(nameInput);uiContainer.appendChild(textBtn);uiContainer.appendChild(saveBtn);targetParent.appendChild(uiContainer);
};

// MutationObserverの設定
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {

        // 要素が追加された場合
        if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) {
                    if (node.matches('.download-link') && node.closest('#easy-generated-audio')) {
                        processDownloadLink(node);
                    } else {
                        const isInsideTarget = node.closest('#easy-generated-audio') || node.id === 'easy-generated-audio';
                        if (isInsideTarget) {
                            const links = node.querySelectorAll('.download-link');
                            links.forEach(processDownloadLink);
                        }
                    }
                }
            }
        }
        // 属性が変更された場合
        else if (mutation.type === 'attributes') {
            const target = mutation.target;

            // 1. .download-link の href が変わった時
            if (mutation.attributeName === 'href' && target.matches('.download-link') && target.closest('#easy-generated-audio')) {
                processDownloadLink(target);
            }

            // 2. [data-testid="status-tracker"] の class が変わった時
            if (mutation.attributeName === 'class' && target.matches('[data-testid="status-tracker"]')) {
                const container = target.closest('#easy-generated-audio');
                if (container) {
                    // 既存のコンテナを削除
                    const existingContainer = container.querySelector('.custom-dl-container') || d.querySelector('.custom-dl-container');
                    if (existingContainer) {
                        existingContainer.remove();
                    }

                    // 新しい speechUrl を取得して再追加
                    const link = container.querySelector('.download-link');
                    if (link) {
                        processDownloadLink(link);
                    }
                }
            }
        }

    }
});

observer.observe(d.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['href', 'class']
});
// ==========================================
// 絵文字Tab - 一括表示/テンプレートの追加
// ==========================================
const groups = [
    ['ポジティブ', '6px', [
        ['😊', '楽しげ'], ['🤭', '笑い'], ['😆', '喜び'], ['🫶', '優しく'],
        ['😌', '安堵'], ['😎', '得意げ'], ['💪', '力強く']
    ]],
    ['ネガティブ', '8px', [
        ['😭', '泣き声'], ['😠', '怒り'], ['😟', '心配'], ['😰', '慌てる'], ['🥺', '震え声'],
        ['😖', '苦しげ'], ['😱', '悲鳴'], ['🙄', '呆れ'], ['😒', '舌打ち']
    ]],
    ['その他の感情', '8px', [
        ['😲', '驚き'], ['🤔', '疑問'], ['🫣', '照れ'], ['😏', 'からかう'],
        ['🙏', '懇願'], ['😪', '眠そう'], ['🥴', '酔う']
    ]],
    ['話し方・演出', '8px', [
        ['👂', '囁き'], ['⏩', '早口'], ['🐢', 'ゆっくり'], ['💥', '勢いよく'], ['📖', '朗読'], ['⏸️', '間'],
        ['📢', 'エコー'], ['📞', '電話越し'], ['👌', '相槌'], ['😴', '寝言'], ['🤐', '口を塞ぐ']
    ]],
    ['息・口などの音', '8px', [
        ['😮‍💨', '吐息'], ['🌬️', '息切れ'], ['😮', '息をのむ'], ['🥱', 'あくび'], ['🥵', '喘ぎ'], ['🤧', '咳・鼻'],
        ['💋', 'リップノイズ'], ['👅', '舐める音'], ['🥤', '飲み込む'], ['👃', '嗅ぐ音'], ['🎵', '鼻歌']
    ]]
];

const insertAtCursor = (el, text) => {
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const v = el.value;
    el.value = v.slice(0, start) + text + v.slice(end);
    el.selectionStart = el.selectionEnd = start + text.length;
    el.focus();
};

const templateKey = 'grmp-templates';
const loadData = async () => {
    const parsed = JSON.parse(await GM.getValue(templateKey, '{}'));
    const list = Array.isArray(parsed) ? parsed : (parsed.templates ?? []);
    return {
        folders: Array.isArray(parsed) ? [] : (parsed.folders ?? []),
        templates: list.map(t => ({ name: t.name, text: t.text, folder: t.folder ?? '' }))
    };
};
const openTemplateManager = async () => {
    if($S('#grmp-template-overlay')) return;

    const data = await loadData();
    const collapsed = new Set(data.folders);
    let editingTemplate = null;
    let hoverTimer = 0;

    const saveData = () => GM.setValue(templateKey, JSON.stringify(data));
    const makeOption = (value, label) => $C('option', { attrs: { value }, props: { textContent: label } });

    const overlay = $C('div', {
        attrs: { id: 'grmp-template-overlay' },
        styles: {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.5)', zIndex: '99999'
        },
        on: { click: e => { if(e.target === overlay) overlay.remove(); } }
    });

    const panel = $C('div', {
        attrs: { id: 'grmp-template-panel' },
        styles: {
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '80%', height: '80%', background: '#18181b', color: '#e4e4e7',
            border: '1px solid #f97316', borderRadius: '8px', padding: '12px',
            display: 'flex', flexDirection: 'column', gap: '8px', boxSizing: 'border-box', overflow: 'hidden'
        }
    });

    const tip = $C('div', {
        styles: {
            position: 'fixed', display: 'none', maxWidth: '420px', maxHeight: '300px', overflow: 'auto',
            whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#222', color: '#fff',
            padding: '8px', borderRadius: '4px', fontSize: '12px', zIndex: '100000', pointerEvents: 'none'
        }
    });

    const panelHeader = $C('div', { styles: { display: 'flex', alignItems: 'center', gap: '12px' } });
    const title = $C('div', { props: { textContent: 'テンプレート管理' }, styles: { color: '#f97316', fontWeight: 'bold' } });
    const tabs = $C('div', { styles: { display: 'flex', gap: '4px', flex: '1' } });
    const tabList = $C('button', { props: { textContent: 'テンプレート' }, on: { click: () => showTab('list') } });
    const tabEdit = $C('button', { props: { textContent: '編集' }, on: { click: () => showTab('edit') } });
    const closeBtn = $C('button', { props: { textContent: '✕ 閉じる' }, on: { click: () => overlay.remove() } });
    tabs.append(tabList, tabEdit);
    panelHeader.append(title, tabs, closeBtn);

    const listPane = $C('div', { styles: { flex: '1', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '0' } });
    const toolbar = $C('div', { styles: { display: 'flex', gap: '6px', alignItems: 'center' } });
    const folderInput = $C('input', {
        attrs: { type: 'text', placeholder: '新しいフォルダ名' },
        styles: { padding: '4px 6px', fontSize: '13px', background: '#18181b', color: '#e4e4e7', border: '1px solid #3f3f46' }
    });
    const addFolderBtn = $C('button', { props: { textContent: '📁 フォルダ追加' } });
    const listBody = $C('div', {
        styles: { flex: '1', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '0' }
    });
    toolbar.append(folderInput, addFolderBtn);
    listPane.append(toolbar, listBody);

    const editPane = $C('div', { styles: { flex: '1', display: 'none', flexDirection: 'column', gap: '6px', minHeight: '0' } });
    const nameInput = $C('input', {
        attrs: { type: 'text', placeholder: 'テンプレート名' },
        styles: { padding: '6px', fontSize: '14px', background: '#18181b', color: '#e4e4e7', border: '1px solid #3f3f46' }
    });
    const editFolder = $C('select', {
        styles: { padding: '4px', fontSize: '13px', background: '#18181b', color: '#e4e4e7', border: '1px solid #3f3f46' }
    });
    const bodyInput = $C('textarea', {
        attrs: { placeholder: 'テンプレート本文（改行可）' },
        styles: { flex: '1', padding: '6px', fontSize: '14px', resize: 'none', whiteSpace: 'pre-wrap', background: '#18181b', color: '#e4e4e7', border: '1px solid #3f3f46' }
    });
    const editButtons = $C('div', { styles: { display: 'flex', gap: '6px' } });
    const saveBtn = $C('button', { props: { textContent: '作成' } });
    const newBtn = $C('button', { props: { textContent: '新規' } });
    editButtons.append(saveBtn, newBtn);
    editPane.append(nameInput, editFolder, bodyInput, editButtons);

    const showTab = name => {
        listPane.style.display = name === 'list' ? 'flex' : 'none';
        editPane.style.display = name === 'edit' ? 'flex' : 'none';
        tabList.style.fontWeight = name === 'list' ? 'bold' : 'normal';
        tabEdit.style.fontWeight = name === 'edit' ? 'bold' : 'normal';
        tabList.style.color = name === 'list' ? '#f97316' : '';
        tabEdit.style.color = name === 'edit' ? '#f97316' : '';
    };

    const refreshEditFolder = () => {
        const current = editFolder.value;
        editFolder.replaceChildren(makeOption('', '未分類'), ...data.folders.map(f => makeOption(f, f)));
        editFolder.value = data.folders.includes(current) ? current : '';
    };

    const resetEditor = () => {
        editingTemplate = null;
        nameInput.value = '';
        bodyInput.value = '';
        editFolder.value = '';
        saveBtn.textContent = '作成';
    };

    const createRow = tpl => {
        const row = $C('div', {
            styles: {
                display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #ddd',
                borderRadius: '4px', padding: '4px 6px', background: tpl === editingTemplate ? '#fff3e6' : '#fafafa'
            },
            on: {
                mouseenter: () => {
                    clearTimeout(hoverTimer);
                    hoverTimer = setTimeout(() => {
                        const rect = row.getBoundingClientRect();
                        tip.textContent = tpl.text;
                        tip.style.left = `${rect.left}px`;
                        tip.style.top = `${rect.bottom + 4}px`;
                        tip.style.display = 'block';
                    }, 300);
                },
                mouseleave: () => {
                    clearTimeout(hoverTimer);
                    tip.style.display = 'none';
                }
            }
        });
        const name = $C('div', {
            props: { textContent: tpl.name },
            styles: { flex: '1', fontWeight: 'bold', color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: '0' }
        });
        const pasteBtn = $C('button', {
            props: { textContent: 'ペースト' },
            styles: { flexShrink: '0', whiteSpace: 'nowrap' },
            on: {
                click: () => {
                    const ta = $S('#grmp-Textarea');
                    if(!ta) return;
                    insertAtCursor(ta, tpl.text);
                    overlay.remove();
                }
            }
        });
        const editBtn = $C('button', {
            props: { textContent: '編集' },
            styles: { flexShrink: '0', whiteSpace: 'nowrap' },
            on: {
                click: () => {
                    editingTemplate = tpl;
                    nameInput.value = tpl.name;
                    bodyInput.value = tpl.text;
                    refreshEditFolder();
                    editFolder.value = tpl.folder;
                    saveBtn.textContent = '更新';
                    renderList();
                    showTab('edit');
                }
            }
        });
        const delBtn = $C('button', {
            props: { textContent: '削除' },
            styles: { flexShrink: '0', whiteSpace: 'nowrap' },
            on: {
                click: async () => {
                    data.templates.splice(data.templates.indexOf(tpl), 1);
                    if(editingTemplate === tpl) resetEditor();
                    await saveData();
                    renderList();
                }
            }
        });
        const moveSel = $C('select', {
            attrs: { title: 'フォルダへ移動' },
            styles: { flexShrink: '0', maxWidth: '120px', background: '#18181b', color: '#e4e4e7', border: '1px solid #3f3f46' },
            on: {
                change: async e => {
                    tpl.folder = e.target.value;
                    await saveData();
                    renderList();
                }
            }
        });
        moveSel.append(makeOption('', '未分類'), ...data.folders.map(f => makeOption(f, f)));
        moveSel.value = tpl.folder;
        row.append(name, pasteBtn, editBtn, delBtn, moveSel);
        return row;
    };

    const createGroup = (folderName, label, isFolder) => {
        const items = data.templates.filter(t => t.folder === folderName);
        const group = $C('div', { styles: { display: 'flex', flexDirection: 'column', gap: '4px' } });
        const isClosed = collapsed.has(folderName);
        const head = $C('div', {
            styles: {
                display: 'flex', alignItems: 'center', gap: '6px', background: '#ffe8d1',
                padding: '4px 6px', borderRadius: '4px', cursor: 'pointer'
            },
            on: {
                click: () => {
                    if(isClosed) collapsed.delete(folderName);
                    else collapsed.add(folderName);
                    renderList();
                }
            }
        });
        const headName = $C('div', {
            props: { textContent: `${isClosed ? '▶' : '▼'} ${isFolder ? '📁' : '📄'} ${label} (${items.length})` },
            styles: { flex: '1', fontWeight: 'bold', color: '#c2410c' }
        });
        head.append(headName);
        if(isFolder){
            const renameBtn = $C('button', {
                props: { textContent: '名前変更' },
                styles: { flexShrink: '0', whiteSpace: 'nowrap' },
                on: {
                    click: async e => {
                        e.stopPropagation();
                        const next = prompt('新しいフォルダ名', folderName)?.trim();
                        if(!next || next === folderName || data.folders.includes(next)) return;
                        data.folders[data.folders.indexOf(folderName)] = next;
                        data.templates.forEach(t => { if(t.folder === folderName) t.folder = next; });
                        if(collapsed.delete(folderName)) collapsed.add(next);
                        await saveData();
                        refreshEditFolder();
                        renderList();
                    }
                }
            });
            const delFolderBtn = $C('button', {
                props: { textContent: 'フォルダ削除' },
                styles: { flexShrink: '0', whiteSpace: 'nowrap' },
                on: {
                    click: async e => {
                        e.stopPropagation();
                        if(!confirm(`フォルダ「${folderName}」を削除しますか？\n中のテンプレートは未分類に移動します。`)) return;
                        data.templates.forEach(t => { if(t.folder === folderName) t.folder = ''; });
                        data.folders.splice(data.folders.indexOf(folderName), 1);
                        collapsed.delete(folderName);
                        await saveData();
                        refreshEditFolder();
                        renderList();
                    }
                }
            });
            head.append(renameBtn, delFolderBtn);
        }
        group.append(head);
        if(!isClosed){
            const inner = $C('div', { styles: { display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '16px' } });
            if(items.length === 0) inner.append($C('div', { props: { textContent: '（空）' }, styles: { color: '#888' } }));
            items.forEach(t => inner.append(createRow(t)));
            group.append(inner);
        }
        return group;
    };

    const renderList = () => {
        clearTimeout(hoverTimer);
        tip.style.display = 'none';
        listBody.replaceChildren();
        if(data.templates.length === 0 && data.folders.length === 0){
            listBody.append($C('div', { props: { textContent: 'テンプレートがありません' }, styles: { color: '#888' } }));
            return;
        }
        data.folders.forEach(f => listBody.append(createGroup(f, f, true)));
        if(data.templates.some(t => t.folder === '')) listBody.append(createGroup('', '未分類', false));
    };

    addFolderBtn.addEventListener('click', async () => {
        const name = folderInput.value.trim();
        if(!name || data.folders.includes(name)) return;
        data.folders.push(name);
        folderInput.value = '';
        await saveData();
        refreshEditFolder();
        renderList();
    });

    saveBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        const text = bodyInput.value;
        if(!name || !text) return;
        if(editingTemplate) Object.assign(editingTemplate, { name, text, folder: editFolder.value });
        else data.templates.push({ name, text, folder: editFolder.value });
        await saveData();
        resetEditor();
        renderList();
        showTab('list');
    });

    newBtn.addEventListener('click', () => {
        resetEditor();
        renderList();
    });

    refreshEditFolder();
    resetEditor();
    renderList();
    showTab('list');
    panel.append(panelHeader, listPane, editPane);
    overlay.append(panel, tip);
    document.body.append(overlay);
};

const build = target => {
    const container = $C('div', { attrs: { id: 'grmp-emotion-container' } });
    const header = $C('div', { attrs: { class: 'grmp-header' }, props: { textContent: '感情・演出を追加' }, styles: { color: '#f97316' } });
    const templateArea = $C('button', {
        attrs: { id: 'grmp-template-area', class: 'grmp-template-area' },
        props: { textContent: 'テンプレート' },
        styles: { display: 'flex', alignItems: 'center', gap: '4px', margin: '0', padding: '0', color: '#f97316' },
        on: { click: openTemplateManager }
    });
    const slashRow = $C('div', {
        props: { textContent: '/' },
        styles: { display: 'flex', alignItems: 'center', gap: '8px' }
    });
    const headerRow = $C('div', {
        attrs: { class: 'grmp-header-row' },
        styles: { display: 'flex', alignItems: 'center', gap: '8px' }
    });
    headerRow.append(header, slashRow, templateArea);
    container.append(headerRow);

    for(const [label, marginTop, items] of groups){
        container.append($C('div', { props: { textContent: label }, styles: { marginTop, marginBottom: '4px' } }));
        for(const [emoji, text] of items){
            container.append($C('button', {
                attrs: { class: 'easy-emoji' },
                props: { textContent: `${emoji} ${text}` },
                styles: { fontSize: '13px', padding: '4px 7px', marginRight: '6px' },
                on: {
                    click: () => {
                        const ta = $S('#grmp-Textarea');
                        if(ta) insertAtCursor(ta, emoji);
                    }
                }
            }));
        }
    }

    target.insertAdjacentElement('afterend', container);
    target.remove();
};

const showAll = () => {
    if($S('#grmp-emotion-container')) return;
    const t = $S('#emoji-area');
    if(t){
        build(t);
        return;
    }
    const timer = setInterval(() => {
        const found = $S('#emoji-area');
        if(!found) return;
        clearInterval(timer);
        if(!$S('#grmp-emotion-container')) build(found);
    }, 200);
};

showAll();

GM_addStyle(`
input { cursor: pointer; }
`)
