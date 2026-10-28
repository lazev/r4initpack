/* Checkbox combo compartilhado. Fields.create({type:'multiselect', options, value:'*'}). */
var FieldsMultiSelect={
    states:new WeakMap(),
    create(item,prefix){
        const id=prefix?prefix+'_'+item.id:item.id,wrap=document.createElement('div'),native=document.createElement('select'),trigger=document.createElement('button'),caption=document.createElement('span');
        wrap.className='R4Fields R4MultiSelect';native.id=id;native.name=item.name||item.id;native.multiple=true;native.hidden=true;native.setAttribute('R4Type','multiselect');
        trigger.type='button';trigger.id=id+'_trigger';trigger.className='R4MultiSelectTrigger';trigger.setAttribute('role','combobox');trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',id+'_choices');trigger.append(caption);wrap.append(native,trigger);
        if(item.label){const label=document.createElement('label');label.innerHTML=item.label;label.id=id+'_label';label.htmlFor=trigger.id;trigger.setAttribute('aria-labelledby',label.id);wrap.append(label);}
        const state={native,wrap,trigger,caption,item,popup:null,all:true};this.states.set(native,state);
        trigger.onclick=()=>state.popup?this.close(native,true):this.open(native);
        trigger.onkeydown=event=>{if(event.key==='ArrowDown'){event.preventDefault();this.open(native);}};
        native.addEventListener('change',()=>{this.refresh(native);Fields.validate(native);});
        native.addEventListener('blur',()=>{state.all=native.options.length>0&&native.selectedOptions.length===native.options.length;this.refresh(native);});
        new MutationObserver(()=>{trigger.disabled=native.disabled;}).observe(native,{attributes:true,attributeFilter:['disabled']});
        if(item.attr)for(const key in item.attr)native.setAttribute(key,item.attr[key]);
        this.setOptions(native,item.options||[],item.value===undefined?'*':item.value);
        Fields.setValidateRules(native,item);
        return wrap;
    },
    getVal(native){return Array.from(native.selectedOptions,option=>option.value);},
    getText(native){return this.states.get(native).caption.textContent;},
    isAll(native){return this.states.get(native).all;},
    setVal(native,value){
        const state=this.states.get(native);if(state.popup)this.close(native,false);
        const values=new Set((Array.isArray(value)?value:value===null?[]:[value]).map(String));
        for(const option of native.options)option.selected=value==='*'||values.has(option.value);
        state.all=value==='*'||(native.options.length>0&&native.selectedOptions.length===native.options.length);this.refresh(native);
    },
    setOptions(native,options,value){
        const state=this.states.get(native),old=state.all?'*':this.getVal(native);
        if(state.popup)this.close(native,false);
        native.replaceChildren();
        if(typeof options==='string'){const source=R4.resolveFunc(options)||window[options];options=typeof source==='function'?source():source;}
        const seen=new Set();for(const key in options){const entry=options[key],id=String(typeof entry==='object'?entry.key:key);if(seen.has(id))continue;seen.add(id);const option=document.createElement('option'),decode=document.createElement('textarea');decode.innerHTML=String(typeof entry==='object'?entry.value:entry);option.value=id;option.textContent=decode.value;native.append(option);}
        this.setVal(native,value===undefined?old:value);
        for(const option of native.options)option.defaultSelected=option.selected;
    },
    refresh(native,values){
        const state=this.states.get(native),chosen=values||this.getVal(native),all=native.options.length>0&&chosen.length===native.options.length;
        let text=state.item.emptyLabel||'Nenhum';
        if(all)text=state.item.allLabel||'Todos';
        else if(chosen.length===1)text=Array.from(native.options).find(option=>option.value===chosen[0])?.textContent||text;
        else if(chosen.length>1)text=chosen.length+' '+(state.item.countLabel||'selecionados');
        state.caption.textContent=text;state.trigger.title=text;state.wrap.classList.add('withContent');state.trigger.disabled=native.disabled;
    },
    open(native){
        const state=this.states.get(native);if(native.disabled||state.popup)return;
        const popup=document.createElement('div');popup.id=native.id+'_choices';popup.className='R4MultiSelectPopup';popup.setAttribute('role','dialog');popup.setAttribute('aria-label',state.item.label||'Selecionar opções');
        const makeCheck=(text,value)=>{const label=document.createElement('label'),input=document.createElement('input'),span=document.createElement('span');input.type='checkbox';input.value=value;span.textContent=text;label.append(input,span);return {label,input};};
        const all=makeCheck(state.item.allLabel||'Todos','*'),list=document.createElement('div'),actions=document.createElement('div');all.label.className='R4MultiSelectAll';list.className='R4MultiSelectOptions';actions.className='R4MultiSelectActions';
        const checks=[];for(const option of native.options){const row=makeCheck(option.textContent,option.value);row.input.checked=option.selected;checks.push(row.input);list.append(row.label);}
        const selected=()=>checks.filter(input=>input.checked).map(input=>input.value);
        const update=()=>{all.input.checked=checks.length>0&&checks.every(input=>input.checked);all.input.indeterminate=!all.input.checked&&checks.some(input=>input.checked);all.input.disabled=!checks.length;this.refresh(native,selected());};
        all.input.onchange=()=>{checks.forEach(input=>{input.checked=all.input.checked;});update();};checks.forEach(input=>input.onchange=update);
        const apply=document.createElement('button'),cancel=document.createElement('button');apply.type=cancel.type='button';apply.textContent='Aplicar';cancel.textContent='Cancelar';apply.className='R4 bgPrimary white R4MultiSelectApply';cancel.className='R4 bgWhite';apply.onclick=()=>this.close(native,true,true);cancel.onclick=()=>this.close(native,false,true);actions.append(cancel,apply);popup.append(all.label,list,actions);document.body.append(popup);
        state.popup=popup;state.selected=selected;state.trigger.setAttribute('aria-expanded','true');
        const position=()=>{const rect=state.trigger.getBoundingClientRect(),width=Math.min(Math.max(rect.width,220),innerWidth-16);popup.style.width=width+'px';popup.style.left=Math.max(8,Math.min(rect.left,innerWidth-width-8))+'px';const height=Math.min(360,Math.max(140,innerHeight-16)),below=innerHeight-rect.bottom-8,above=rect.top-8;popup.style.maxHeight=Math.min(height,Math.max(below,above))+'px';popup.style.top=(below>=Math.min(height,popup.scrollHeight)||below>=above?rect.bottom+3:Math.max(8,rect.top-Math.min(height,popup.scrollHeight)-3))+'px';};
        state.outside=event=>{if(!popup.contains(event.target)&&!state.wrap.contains(event.target))this.close(native,true);};
        state.position=position;document.addEventListener('pointerdown',state.outside,true);window.addEventListener('resize',position);window.addEventListener('scroll',position,true);
        popup.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();this.close(native,false,true);}};
        popup.addEventListener('focusout',()=>setTimeout(()=>{if(state.popup&&!popup.contains(document.activeElement)&&document.activeElement!==state.trigger)this.close(native,true);},0));
        update();position();all.input.focus();
    },
    close(native,commit,focus=false){
        const state=this.states.get(native);if(!state.popup)return;
        const before=JSON.stringify(this.getVal(native)),values=state.selected();
        state.popup.remove();state.popup=null;document.removeEventListener('pointerdown',state.outside,true);window.removeEventListener('resize',state.position);window.removeEventListener('scroll',state.position,true);state.trigger.setAttribute('aria-expanded','false');
        if(commit)this.setVal(native,values);else this.refresh(native);
        if(focus)state.trigger.focus();
        if(commit&&before!==JSON.stringify(this.getVal(native)))native.dispatchEvent(new Event('change',{bubbles:true}));
    }
};
