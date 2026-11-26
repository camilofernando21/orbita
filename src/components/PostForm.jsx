import { useMemo, useRef, useState } from 'react';
import { corTag, hashTexto } from '../utils/ceu';
import { useLingua } from '../contexts/LinguaContext';
import Nebulosa from './Nebulosa';
import Icone from './Icone';

const LIMITE_TITULO = 120;
const LIMITE_TEXTO = 2000;

// Validação básica. Devolve um objeto { campo: mensagem } só com os campos inválidos.
function validar(v, t) {
  const erros = {};
  const titulo = v.title.trim();
  const texto = v.body.trim();

  if (!titulo) erros.title = t('form.erroTituloVazio');
  else if (titulo.length < 5) erros.title = t('form.erroTituloCurto');
  else if (titulo.length > LIMITE_TITULO) erros.title = t('form.erroTituloLongo', { n: LIMITE_TITULO });

  if (!texto) erros.body = t('form.erroTextoVazio');
  else if (texto.length < 20) erros.body = t('form.erroTextoCurto');
  else if (texto.length > LIMITE_TEXTO) erros.body = t('form.erroTextoLongo', { n: LIMITE_TEXTO });

  if (!v.constelacao) erros.constelacao = t('form.erroConstelacao');

  const extras = v.extras.split(',').map((t) => t.trim()).filter(Boolean);
  if (extras.length > 2) erros.extras = t('form.erroExtrasMuitas');
  else if (extras.some((tag) => !/^[a-z]{2,20}$/.test(tag))) erros.extras = t('form.erroExtrasFormato');

  return erros;
}

export default function PostForm({ inicial, constelacoes, modo, aoEnviar, textoEnviar, textoEnviando, aoCancelar }) {
  const { t, nomeTag } = useLingua();
  const [valores, setValores] = useState(() => ({
    title: inicial?.titulo || inicial?.title || '',
    body: inicial?.texto || inicial?.body || '',
    constelacao: inicial?.constelacao && inicial.constelacao !== 'diversas' ? inicial.constelacao : '',
    extras: (inicial?.tags || []).filter((t) => t !== inicial?.constelacao).slice(0, 2).join(', '),
  }));
  const [tocados, setTocados] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);
  const campos = { title: useRef(null), body: useRef(null), constelacao: useRef(null), extras: useRef(null) };

  const erros = validar(valores, t);
  const mostrarErro = (campo) => (tocados[campo] ? erros[campo] : undefined);

  function mudar(e) {
    const { name, value } = e.target;
    setValores((v) => ({ ...v, [name]: value }));
  }

  function tocar(e) {
    setTocados((t) => ({ ...t, [e.target.name]: true }));
  }

  async function enviar(e) {
    e.preventDefault();
    setTocados({ title: true, body: true, constelacao: true, extras: true });
    const primeiroInvalido = Object.keys(campos).find((c) => erros[c]);
    if (primeiroInvalido) {
      campos[primeiroInvalido].current?.focus();
      return;
    }

    const extras = valores.extras.split(',').map((t) => t.trim()).filter(Boolean);
    const tags = [valores.constelacao, ...extras.filter((t) => t !== valores.constelacao)];

    setEnviando(true);
    setErroEnvio(null);
    try {
      await aoEnviar({ title: valores.title.trim(), body: valores.body.trim(), tags });
    } catch (falha) {
      setErroEnvio(falha.message || '');
      setEnviando(false);
    }
  }

  // Prévia ao vivo: a nebulosa muda conforme o título e a constelação.
  const previa = useMemo(
    () => ({ id: 0, title: valores.title || t('form.novaPadrao'), constelacao: valores.constelacao || 'history', tags: [valores.constelacao || 'history'], views: 400 }),
    [valores.title, valores.constelacao, t],
  );

  const ajuda = (campo, texto) => (
    <p className="campo-ajuda" id={`ajuda-${campo}`}>{texto}</p>
  );
  const erro = (campo) => (
    <p className="campo-erro" id={`erro-${campo}`}>{mostrarErro(campo) || ''}</p>
  );
  const descricao = (campo) => `ajuda-${campo} erro-${campo}`;

  return (
    <form className="formulario" onSubmit={enviar} noValidate aria-busy={enviando}>
      <div className="formulario-campos">
        <div className="campo">
          <div className="campo-topo">
            <label htmlFor="campo-titulo">{t('form.titulo')}</label>
            <span className="contador" aria-hidden="true">{valores.title.trim().length}/{LIMITE_TITULO}</span>
          </div>
          <input
            id="campo-titulo"
            ref={campos.title}
            name="title"
            value={valores.title}
            onChange={mudar}
            onBlur={tocar}
            aria-invalid={Boolean(mostrarErro('title'))}
            aria-describedby={descricao('title')}
            maxLength={LIMITE_TITULO + 20}
            autoComplete="off"
          />
          {ajuda('title', t('form.ajudaTitulo'))}
          {erro('title')}
        </div>

        <div className="campo">
          <div className="campo-topo">
            <label htmlFor="campo-texto">{t('form.texto')}</label>
            <span className="contador" aria-hidden="true">{valores.body.trim().length}/{LIMITE_TEXTO}</span>
          </div>
          <textarea
            id="campo-texto"
            ref={campos.body}
            name="body"
            rows={7}
            value={valores.body}
            onChange={mudar}
            onBlur={tocar}
            aria-invalid={Boolean(mostrarErro('body'))}
            aria-describedby={descricao('body')}
          />
          {ajuda('body', t('form.ajudaTexto'))}
          {erro('body')}
        </div>

        <div className="campo-duplo">
          <div className="campo">
            <label htmlFor="campo-constelacao">{t('form.constelacao')}</label>
            <select
              id="campo-constelacao"
              ref={campos.constelacao}
              name="constelacao"
              value={valores.constelacao}
              onChange={mudar}
              onBlur={tocar}
              aria-invalid={Boolean(mostrarErro('constelacao'))}
              aria-describedby={descricao('constelacao')}
            >
              <option value="">{t('form.escolha')}</option>
              {constelacoes.filter((c) => c.tag !== 'diversas').map((c) => (
                <option key={c.tag} value={c.tag}>{nomeTag(c.tag)}</option>
              ))}
            </select>
            {ajuda('constelacao', t('form.ajudaConstelacao'))}
            {erro('constelacao')}
          </div>

          <div className="campo">
            <label htmlFor="campo-extras">{t('form.extras')} <span className="opcional">{t('form.opcional')}</span></label>
            <input
              id="campo-extras"
              ref={campos.extras}
              name="extras"
              value={valores.extras}
              onChange={mudar}
              onBlur={tocar}
              aria-invalid={Boolean(mostrarErro('extras'))}
              aria-describedby={descricao('extras')}
              placeholder={t('form.extrasExemplo')}
              autoComplete="off"
            />
            {ajuda('extras', t('form.ajudaExtras'))}
            {erro('extras')}
          </div>
        </div>

        {erroEnvio && (
          <div className="alerta-erro" role="alert">
            <strong>{t('form.erroEnvio')}</strong> {erroEnvio} {t('form.erroEnvioDica')}
          </div>
        )}

        <div className="formulario-acoes">
          <button type="submit" className="botao botao-primario botao-grande" disabled={enviando}>
            <Icone nome="estrela" tamanho={18} />
            {enviando ? textoEnviando : textoEnviar}
          </button>
          <button type="button" className="botao botao-grande" onClick={aoCancelar} disabled={enviando}>
            {t('form.cancelar')}
          </button>
        </div>
      </div>

      <aside className="formulario-previa" aria-label={t('form.previa')}>
        <div className="previa-arte" style={{ '--cor': valores.constelacao ? corTag(valores.constelacao, modo) : 'var(--suave)' }}>
          <Nebulosa post={previa} modo={modo} variante="previa" semente={hashTexto(valores.title || 'nova')} />
        </div>
        <p className="previa-legenda">
          {valores.constelacao
            ? <>{t('form.previaCom')} <strong>{nomeTag(valores.constelacao)}</strong>.</>
            : t('form.previaSem')}
        </p>
        <p className="previa-titulo">{valores.title.trim() || t('form.semTitulo')}</p>
      </aside>
    </form>
  );
}
