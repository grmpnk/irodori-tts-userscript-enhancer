// ==UserScript==
// @name         Easy-Irodori-TTS(ローカル環境版) 拡張機能
// @namespace    http://tampermonkey.net/
// @version      Easy-Irodori-TTS-v1.1
// @description  無料の音声生成AIの拡張機能 - ショートカットの追加/ファイル名を指定/演出の一括表示
// @author       grmpneko
// @match        http://127.0.0.1:7860/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=127.0.0.1
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_download
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
// 絵文字Tab - 一括表示
// ==========================================
function showAll(){
    if ($S('#grmp-emotion-container')) return;
    let t = $S('#emoji-area');
    const insertAtCursor = (el, text) => {
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        const v = el.value;
        el.value = v.slice(0, start) + text + v.slice(end);
        const pos = start + text.length;
        el.selectionStart = el.selectionEnd = pos;
        el.focus();
    };
    const container = $C('div', { attrs: { id: 'grmp-emotion-container' }});
    const header = $C('div', { attrs: { class: 'grmp-header' }, props: { textContent: '感情・演出を追加' }, styles: { color: '#f97316' } });

    const posLabel = $C('div', { props: { textContent: 'ポジティブ' }, styles: { marginTop: '6px', marginBottom: '4px' } });
    const posBtn1 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '😊 楽しげ' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "😊"); } } });
    const posBtn2 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '🤭 笑い' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "🤭"); } } });
    const posBtn3 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '😆 喜び' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "😆"); } } });
    const posBtn4 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '🫶 優しく' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "🫶"); } } });
    const posBtn5 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '😌 安堵' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "😌"); } } });
    const posBtn6 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '😎 得意げ' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "😎"); } } });
    const posBtn7 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '💪 力強く' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "💪"); } } });

    const negLabel = $C('div', { props: { textContent: 'ネガティブ' }, styles: { marginTop: '8px', marginBottom: '4px' } });
    const negBtn1 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '😭 泣き声' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "😭"); } } });
    const negBtn2 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '😠 怒り' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "😠"); } } });
    const negBtn3 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '😟 心配' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "😟"); } } });
    const negBtn4 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '😰 慌てる' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "😰"); } } });
    const negBtn5 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '🥺 震え声' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "🥺"); } } });
    const negBtn6 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '😖 苦しげ' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "😖"); } } });
    const negBtn7 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '😱 悲鳴' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "😱"); } } });
    const negBtn8 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '🙄 呆れ' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "🙄"); } } });
    const negBtn9 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '😒 舌打ち' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "😒"); } } });

    const otherLabel = $C('div', { props: { textContent: 'その他の感情' }, styles: { marginTop: '8px', marginBottom: '4px' } });
    const otherBtn1 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '😲 驚き' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "😲"); } } });
    const otherBtn2 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '🤔 疑問' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "🤔"); } } });
    const otherBtn3 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '🫣 照れ' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "🫣"); } } });
    const otherBtn4 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '😏 からかう' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "😏"); } } });
    const otherBtn5 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '🙏 懇願' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "🙏"); } } });
    const otherBtn6 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '😪 眠そう' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "😪"); } } });
    const otherBtn7 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '🥴 酔う' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "🥴"); } } });

    const direLabel = $C('div', { props: { textContent: '話し方・演出' }, styles: { marginTop: '8px', marginBottom: '4px' } });
    const direBtn1 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '👂 囁き' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "👂"); } } });
    const direBtn2 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '⏩ 早口' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "⏩"); } } });
    const direBtn3 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '🐢 ゆっくり' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "🐢"); } } });
    const direBtn4 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '💥 勢いよく' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "💥"); } } });
    const direBtn5 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '📖 朗読' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "📖"); } } });
    const direBtn6 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '⏸️ 間' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "⏸️"); } } });
    const direBtn7 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '📢 エコー' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "📢"); } } });
    const direBtn8 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '📞 電話越し' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "📞"); } } });
    const direBtn9 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '👌 相槌' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "👌"); } } });
    const direBtn10 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '😴 寝言' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "😴"); } } });
    const direBtn11 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '🤐 口を塞ぐ' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "🤐"); } } });

    const mouthLabel = $C('div', { props: { textContent: '息・口などの音' }, styles: { marginTop: '8px', marginBottom: '4px' } });
    const mouthLabelBtn1 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '😮‍💨 吐息' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "😮‍💨"); } } });
    const mouthLabelBtn2 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '🌬️ 息切れ' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "🌬️"); } } });
    const mouthLabelBtn3 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '😮 息をのむ' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "😮"); } } });
    const mouthLabelBtn4 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '🥱 あくび' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "🥱"); } } });
    const mouthLabelBtn5 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '🥵 喘ぎ' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "🥵"); } } });
    const mouthLabelBtn6 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '🤧 咳・鼻' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "🤧"); } } });
    const mouthLabelBtn7 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '💋 リップノイズ' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "💋"); } } });
    const mouthLabelBtn8 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '👅 舐める音' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "👅"); } } });
    const mouthLabelBtn9 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '🥤 飲み込む' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "🥤"); } } });
    const mouthLabelBtn10 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '👃 嗅ぐ音' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "👃"); } } });
    const mouthLabelBtn11 = $C('button', { attrs: { class: 'easy-emoji' }, props: { textContent: '🎵 鼻歌' }, styles: { fontSize: "13px",padding: "4px 7px", marginRight: '6px' }, on: { click: e => { const ta = $S('#grmp-Textarea'); if(!ta) return; insertAtCursor(ta, "🎵"); } } });

    if (t) {
        t.insertAdjacentElement('afterend', container);
        container.append(header,
                     posLabel,
                     posBtn1,posBtn2,posBtn3,posBtn4,posBtn5,posBtn6,posBtn7,
                     negLabel,
                     negBtn1,negBtn2,negBtn3,negBtn4,negBtn5,negBtn6,negBtn7,negBtn8,negBtn9,
                     otherLabel,
                     otherBtn1,otherBtn2,otherBtn3,otherBtn4,otherBtn5,otherBtn6,otherBtn7,
                     direLabel,
                     direBtn1,direBtn2,direBtn3,direBtn4,direBtn5,direBtn6,direBtn7,direBtn8,direBtn9,direBtn10,direBtn11,
                     mouthLabel,
                     mouthLabelBtn1,mouthLabelBtn2,mouthLabelBtn3,mouthLabelBtn4,mouthLabelBtn5,mouthLabelBtn6,mouthLabelBtn7,mouthLabelBtn8,mouthLabelBtn9,mouthLabelBtn10,mouthLabelBtn11
                    );
        $S('#emoji-area').remove()
    } else {
        const observer = new MutationObserver((mutations, obs) => {
            let t = $S('#emoji-area');

            if (t) {
                obs.disconnect();
                t.insertAdjacentElement('afterend', container);
                container.append(header,
                     posLabel,
                     posBtn1,posBtn2,posBtn3,posBtn4,posBtn5,posBtn6,posBtn7,
                     negLabel,
                     negBtn1,negBtn2,negBtn3,negBtn4,negBtn5,negBtn6,negBtn7,negBtn8,negBtn9,
                     otherLabel,
                     otherBtn1,otherBtn2,otherBtn3,otherBtn4,otherBtn5,otherBtn6,otherBtn7,
                     direLabel,
                     direBtn1,direBtn2,direBtn3,direBtn4,direBtn5,direBtn6,direBtn7,direBtn8,direBtn9,direBtn10,direBtn11,
                     mouthLabel,
                     mouthLabelBtn1,mouthLabelBtn2,mouthLabelBtn3,mouthLabelBtn4,mouthLabelBtn5,mouthLabelBtn6,mouthLabelBtn7,mouthLabelBtn8,mouthLabelBtn9,mouthLabelBtn10,mouthLabelBtn11
                    );
                $S('#emoji-area').remove()
            }
        });

        observer.observe(document, { childList: true, subtree: true });
    }
}showAll()

GM_addStyle(`
input { cursor: pointer; }
`)
