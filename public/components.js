/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const N = globalThis, F = N.ShadowRoot && (N.ShadyCSS === void 0 || N.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, B = Symbol(), K = /* @__PURE__ */ new WeakMap();
let ne = class {
  constructor(e, t, s) {
    if (this._$cssResult$ = !0, s !== B) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (F && e === void 0) {
      const s = t !== void 0 && t.length === 1;
      s && (e = K.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), s && K.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const pe = (i) => new ne(typeof i == "string" ? i : i + "", void 0, B), q = (i, ...e) => {
  const t = i.length === 1 ? i[0] : e.reduce((s, r, o) => s + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + i[o + 1], i[0]);
  return new ne(t, i, B);
}, ge = (i, e) => {
  if (F) i.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const s = document.createElement("style"), r = N.litNonce;
    r !== void 0 && s.setAttribute("nonce", r), s.textContent = t.cssText, i.appendChild(s);
  }
}, Z = F ? (i) => i : (i) => i instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const s of e.cssRules) t += s.cssText;
  return pe(t);
})(i) : i;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: fe, defineProperty: $e, getOwnPropertyDescriptor: me, getOwnPropertyNames: _e, getOwnPropertySymbols: ye, getPrototypeOf: ve } = Object, j = globalThis, Q = j.trustedTypes, be = Q ? Q.emptyScript : "", Ae = j.reactiveElementPolyfillSupport, C = (i, e) => i, k = { toAttribute(i, e) {
  switch (e) {
    case Boolean:
      i = i ? be : null;
      break;
    case Object:
    case Array:
      i = i == null ? i : JSON.stringify(i);
  }
  return i;
}, fromAttribute(i, e) {
  let t = i;
  switch (e) {
    case Boolean:
      t = i !== null;
      break;
    case Number:
      t = i === null ? null : Number(i);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(i);
      } catch {
        t = null;
      }
  }
  return t;
} }, V = (i, e) => !fe(i, e), X = { attribute: !0, type: String, converter: k, reflect: !1, useDefault: !1, hasChanged: V };
Symbol.metadata ??= Symbol("metadata"), j.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let A = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = X) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const s = Symbol(), r = this.getPropertyDescriptor(e, s, t);
      r !== void 0 && $e(this.prototype, e, r);
    }
  }
  static getPropertyDescriptor(e, t, s) {
    const { get: r, set: o } = me(this.prototype, e) ?? { get() {
      return this[t];
    }, set(n) {
      this[t] = n;
    } };
    return { get: r, set(n) {
      const l = r?.call(this);
      o?.call(this, n), this.requestUpdate(e, l, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? X;
  }
  static _$Ei() {
    if (this.hasOwnProperty(C("elementProperties"))) return;
    const e = ve(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(C("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(C("properties"))) {
      const t = this.properties, s = [..._e(t), ...ye(t)];
      for (const r of s) this.createProperty(r, t[r]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [s, r] of t) this.elementProperties.set(s, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, s] of this.elementProperties) {
      const r = this._$Eu(t, s);
      r !== void 0 && this._$Eh.set(r, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const s = new Set(e.flat(1 / 0).reverse());
      for (const r of s) t.unshift(Z(r));
    } else e !== void 0 && t.push(Z(e));
    return t;
  }
  static _$Eu(e, t) {
    const s = t.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
  }
  addController(e) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
  }
  removeController(e) {
    this._$EO?.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const s of t.keys()) this.hasOwnProperty(s) && (e.set(s, this[s]), delete this[s]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return ge(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, t, s) {
    this._$AK(e, s);
  }
  _$ET(e, t) {
    const s = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, s);
    if (r !== void 0 && s.reflect === !0) {
      const o = (s.converter?.toAttribute !== void 0 ? s.converter : k).toAttribute(t, s.type);
      this._$Em = e, o == null ? this.removeAttribute(r) : this.setAttribute(r, o), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const s = this.constructor, r = s._$Eh.get(e);
    if (r !== void 0 && this._$Em !== r) {
      const o = s.getPropertyOptions(r), n = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : k;
      this._$Em = r, this[r] = n.fromAttribute(t, o.type) ?? this._$Ej?.get(r) ?? null, this._$Em = null;
    }
  }
  requestUpdate(e, t, s) {
    if (e !== void 0) {
      const r = this.constructor, o = this[e];
      if (s ??= r.getPropertyOptions(e), !((s.hasChanged ?? V)(o, t) || s.useDefault && s.reflect && o === this._$Ej?.get(e) && !this.hasAttribute(r._$Eu(e, s)))) return;
      this.C(e, t, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: s, reflect: r, wrapped: o }, n) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, n ?? t ?? this[e]), o !== !0 || n !== void 0) || (this._$AL.has(e) || (this.hasUpdated || s || (t = void 0), this._$AL.set(e, t)), r === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [r, o] of this._$Ep) this[r] = o;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [r, o] of s) {
        const { wrapped: n } = o, l = this[r];
        n !== !0 || this._$AL.has(r) || l === void 0 || this.C(r, void 0, o, l);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((s) => s.hostUpdate?.()), this.update(t)) : this._$EM();
    } catch (s) {
      throw e = !1, this._$EM(), s;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach((t) => t.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq &&= this._$Eq.forEach((t) => this._$ET(t, this[t])), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
A.elementStyles = [], A.shadowRootOptions = { mode: "open" }, A[C("elementProperties")] = /* @__PURE__ */ new Map(), A[C("finalized")] = /* @__PURE__ */ new Map(), Ae?.({ ReactiveElement: A }), (j.reactiveElementVersions ??= []).push("2.1.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const W = globalThis, H = W.trustedTypes, ee = H ? H.createPolicy("lit-html", { createHTML: (i) => i }) : void 0, ae = "$lit$", f = `lit$${Math.random().toFixed(9).slice(2)}$`, le = "?" + f, we = `<${le}>`, v = document, P = () => v.createComment(""), O = (i) => i === null || typeof i != "object" && typeof i != "function", J = Array.isArray, Ee = (i) => J(i) || typeof i?.[Symbol.iterator] == "function", I = `[ 	
\f\r]`, x = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, te = /-->/g, se = />/g, $ = RegExp(`>|${I}(?:([^\\s"'>=/]+)(${I}*=${I}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), re = /'/g, ie = /"/g, he = /^(?:script|style|textarea|title)$/i, Se = (i) => (e, ...t) => ({ _$litType$: i, strings: e, values: t }), m = Se(1), w = Symbol.for("lit-noChange"), d = Symbol.for("lit-nothing"), oe = /* @__PURE__ */ new WeakMap(), _ = v.createTreeWalker(v, 129);
function ce(i, e) {
  if (!J(i) || !i.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ee !== void 0 ? ee.createHTML(e) : e;
}
const xe = (i, e) => {
  const t = i.length - 1, s = [];
  let r, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", n = x;
  for (let l = 0; l < t; l++) {
    const a = i[l];
    let c, u, h = -1, p = 0;
    for (; p < a.length && (n.lastIndex = p, u = n.exec(a), u !== null); ) p = n.lastIndex, n === x ? u[1] === "!--" ? n = te : u[1] !== void 0 ? n = se : u[2] !== void 0 ? (he.test(u[2]) && (r = RegExp("</" + u[2], "g")), n = $) : u[3] !== void 0 && (n = $) : n === $ ? u[0] === ">" ? (n = r ?? x, h = -1) : u[1] === void 0 ? h = -2 : (h = n.lastIndex - u[2].length, c = u[1], n = u[3] === void 0 ? $ : u[3] === '"' ? ie : re) : n === ie || n === re ? n = $ : n === te || n === se ? n = x : (n = $, r = void 0);
    const g = n === $ && i[l + 1].startsWith("/>") ? " " : "";
    o += n === x ? a + we : h >= 0 ? (s.push(c), a.slice(0, h) + ae + a.slice(h) + f + g) : a + f + (h === -2 ? l : g);
  }
  return [ce(i, o + (i[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), s];
};
class M {
  constructor({ strings: e, _$litType$: t }, s) {
    let r;
    this.parts = [];
    let o = 0, n = 0;
    const l = e.length - 1, a = this.parts, [c, u] = xe(e, t);
    if (this.el = M.createElement(c, s), _.currentNode = this.el.content, t === 2 || t === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (r = _.nextNode()) !== null && a.length < l; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const h of r.getAttributeNames()) if (h.endsWith(ae)) {
          const p = u[n++], g = r.getAttribute(h).split(f), R = /([.?@])?(.*)/.exec(p);
          a.push({ type: 1, index: o, name: R[2], strings: g, ctor: R[1] === "." ? Pe : R[1] === "?" ? Oe : R[1] === "@" ? Me : z }), r.removeAttribute(h);
        } else h.startsWith(f) && (a.push({ type: 6, index: o }), r.removeAttribute(h));
        if (he.test(r.tagName)) {
          const h = r.textContent.split(f), p = h.length - 1;
          if (p > 0) {
            r.textContent = H ? H.emptyScript : "";
            for (let g = 0; g < p; g++) r.append(h[g], P()), _.nextNode(), a.push({ type: 2, index: ++o });
            r.append(h[p], P());
          }
        }
      } else if (r.nodeType === 8) if (r.data === le) a.push({ type: 2, index: o });
      else {
        let h = -1;
        for (; (h = r.data.indexOf(f, h + 1)) !== -1; ) a.push({ type: 7, index: o }), h += f.length - 1;
      }
      o++;
    }
  }
  static createElement(e, t) {
    const s = v.createElement("template");
    return s.innerHTML = e, s;
  }
}
function E(i, e, t = i, s) {
  if (e === w) return e;
  let r = s !== void 0 ? t._$Co?.[s] : t._$Cl;
  const o = O(e) ? void 0 : e._$litDirective$;
  return r?.constructor !== o && (r?._$AO?.(!1), o === void 0 ? r = void 0 : (r = new o(i), r._$AT(i, t, s)), s !== void 0 ? (t._$Co ??= [])[s] = r : t._$Cl = r), r !== void 0 && (e = E(i, r._$AS(i, e.values), r, s)), e;
}
class Ce {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: s } = this._$AD, r = (e?.creationScope ?? v).importNode(t, !0);
    _.currentNode = r;
    let o = _.nextNode(), n = 0, l = 0, a = s[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let c;
        a.type === 2 ? c = new T(o, o.nextSibling, this, e) : a.type === 1 ? c = new a.ctor(o, a.name, a.strings, this, e) : a.type === 6 && (c = new Te(o, this, e)), this._$AV.push(c), a = s[++l];
      }
      n !== a?.index && (o = _.nextNode(), n++);
    }
    return _.currentNode = v, r;
  }
  p(e) {
    let t = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(e, s, t), t += s.strings.length - 2) : s._$AI(e[t])), t++;
  }
}
class T {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, t, s, r) {
    this.type = 2, this._$AH = d, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = s, this.options = r, this._$Cv = r?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = E(this, e, t), O(e) ? e === d || e == null || e === "" ? (this._$AH !== d && this._$AR(), this._$AH = d) : e !== this._$AH && e !== w && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Ee(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== d && O(this._$AH) ? this._$AA.nextSibling.data = e : this.T(v.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: s } = e, r = typeof s == "number" ? this._$AC(e) : (s.el === void 0 && (s.el = M.createElement(ce(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === r) this._$AH.p(t);
    else {
      const o = new Ce(r, this), n = o.u(this.options);
      o.p(t), this.T(n), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = oe.get(e.strings);
    return t === void 0 && oe.set(e.strings, t = new M(e)), t;
  }
  k(e) {
    J(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let s, r = 0;
    for (const o of e) r === t.length ? t.push(s = new T(this.O(P()), this.O(P()), this, this.options)) : s = t[r], s._$AI(o), r++;
    r < t.length && (this._$AR(s && s._$AB.nextSibling, r), t.length = r);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e && e !== this._$AB; ) {
      const s = e.nextSibling;
      e.remove(), e = s;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class z {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, s, r, o) {
    this.type = 1, this._$AH = d, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = o, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = d;
  }
  _$AI(e, t = this, s, r) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) e = E(this, e, t, 0), n = !O(e) || e !== this._$AH && e !== w, n && (this._$AH = e);
    else {
      const l = e;
      let a, c;
      for (e = o[0], a = 0; a < o.length - 1; a++) c = E(this, l[s + a], t, a), c === w && (c = this._$AH[a]), n ||= !O(c) || c !== this._$AH[a], c === d ? e = d : e !== d && (e += (c ?? "") + o[a + 1]), this._$AH[a] = c;
    }
    n && !r && this.j(e);
  }
  j(e) {
    e === d ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Pe extends z {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === d ? void 0 : e;
  }
}
class Oe extends z {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== d);
  }
}
class Me extends z {
  constructor(e, t, s, r, o) {
    super(e, t, s, r, o), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = E(this, e, t, 0) ?? d) === w) return;
    const s = this._$AH, r = e === d && s !== d || e.capture !== s.capture || e.once !== s.once || e.passive !== s.passive, o = e !== d && (s === d || r);
    r && this.element.removeEventListener(this.name, this, s), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Te {
  constructor(e, t, s) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    E(this, e);
  }
}
const Ue = W.litHtmlPolyfillSupport;
Ue?.(M, T), (W.litHtmlVersions ??= []).push("3.3.0");
const Re = (i, e, t) => {
  const s = t?.renderBefore ?? e;
  let r = s._$litPart$;
  if (r === void 0) {
    const o = t?.renderBefore ?? null;
    s._$litPart$ = r = new T(e.insertBefore(P(), o), o, void 0, t ?? {});
  }
  return r._$AI(i), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Y = globalThis;
class y extends A {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Re(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return w;
  }
}
y._$litElement$ = !0, y.finalized = !0, Y.litElementHydrateSupport?.({ LitElement: y });
const Ne = Y.litElementPolyfillSupport;
Ne?.({ LitElement: y });
(Y.litElementVersions ??= []).push("4.2.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const G = (i) => (e, t) => {
  t !== void 0 ? t.addInitializer(() => {
    customElements.define(i, e);
  }) : customElements.define(i, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ke = { attribute: !0, type: String, converter: k, reflect: !1, hasChanged: V }, He = (i = ke, e, t) => {
  const { kind: s, metadata: r } = t;
  let o = globalThis.litPropertyMetadata.get(r);
  if (o === void 0 && globalThis.litPropertyMetadata.set(r, o = /* @__PURE__ */ new Map()), s === "setter" && ((i = Object.create(i)).wrapped = !0), o.set(t.name, i), s === "accessor") {
    const { name: n } = t;
    return { set(l) {
      const a = e.get.call(this);
      e.set.call(this, l), this.requestUpdate(n, a, i);
    }, init(l) {
      return l !== void 0 && this.C(n, void 0, i, l), l;
    } };
  }
  if (s === "setter") {
    const { name: n } = t;
    return function(l) {
      const a = this[n];
      e.call(this, l), this.requestUpdate(n, a, i);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function De(i) {
  return (e, t) => typeof t == "object" ? He(i, e, t) : ((s, r, o) => {
    const n = r.hasOwnProperty(o);
    return r.constructor.createProperty(o, s), n ? Object.getOwnPropertyDescriptor(r, o) : void 0;
  })(i, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function S(i) {
  return De({ ...i, state: !0, attribute: !1 });
}
var Le = Object.defineProperty, je = Object.getOwnPropertyDescriptor, de = (i, e, t, s) => {
  for (var r = s > 1 ? void 0 : s ? je(e, t) : e, o = i.length - 1, n; o >= 0; o--)
    (n = i[o]) && (r = (s ? n(e, t, r) : n(r)) || r);
  return s && r && Le(e, t, r), r;
};
let D = class extends y {
  constructor() {
    super(...arguments), this.dragOver = !1;
  }
  render() {
    return m`
      <div 
        class="drop-zone ${this.dragOver ? "drag-over" : ""}"
        @click=${this.handleClick}
        @dragover=${this.handleDragOver}
        @dragleave=${this.handleDragLeave}
        @drop=${this.handleDrop}
      >
        <p>Drop files or folders here, or click to browse</p>
        <button type="button" class="btn-primary">Browse Files</button>
        <input 
          type="file" 
          multiple 
          @change=${this.handleFileInput}
          id="fileInput"
        >
      </div>
    `;
  }
  handleClick() {
    this.shadowRoot?.getElementById("fileInput")?.click();
  }
  handleDragOver(i) {
    i.preventDefault(), this.dragOver = !0;
  }
  handleDragLeave() {
    this.dragOver = !1;
  }
  handleDrop(i) {
    i.preventDefault(), this.dragOver = !1;
    const e = Array.from(i.dataTransfer?.files || []);
    this.processFiles(e);
  }
  handleFileInput(i) {
    const e = i.target, t = Array.from(e.files || []);
    this.processFiles(t);
  }
  processFiles(i) {
    const e = i.map((t) => ({
      path: t.webkitRelativePath || t.name,
      name: t.name,
      isDirectory: t.type === "" && t.size === 0,
      originalName: t.name
    }));
    this.dispatchEvent(new CustomEvent("files-added", {
      detail: e,
      bubbles: !0
    }));
  }
};
D.styles = q`
    .drop-zone {
      border: 2px dashed var(--border);
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      transition: all 0.2s;
      cursor: pointer;
    }

    .drop-zone:hover, .drop-zone.drag-over {
      border-color: var(--primary-color);
      background-color: rgb(79 70 229 / 0.05);
    }

    .drop-zone p {
      margin-bottom: 1rem;
      color: var(--text-secondary);
    }

    input[type="file"] {
      display: none;
    }
  `;
de([
  S()
], D.prototype, "dragOver", 2);
D = de([
  G("file-manager")
], D);
var ze = Object.defineProperty, Ie = Object.getOwnPropertyDescriptor, ue = (i, e, t, s) => {
  for (var r = s > 1 ? void 0 : s ? Ie(e, t) : e, o = i.length - 1, n; o >= 0; o--)
    (n = i[o]) && (r = (s ? n(e, t, r) : n(r)) || r);
  return s && r && ze(e, t, r), r;
};
let L = class extends y {
  constructor() {
    super(...arguments), this.rules = "";
  }
  connectedCallback() {
    super.connectedCallback(), this.loadRules();
  }
  render() {
    return m`
      <div class="form-group">
        <label for="rules">Renaming Rules:</label>
        <textarea
          id="rules"
          .value=${this.rules}
          @input=${this.handleRulesChange}
          placeholder="Describe how you want to rename your files. For example:&#10;- Convert to kebab-case&#10;- Remove spaces and special characters&#10;- Add date prefix (YYYY-MM-DD)&#10;- Convert to lowercase"
        ></textarea>
      </div>
    `;
  }
  handleRulesChange(i) {
    const e = i.target;
    this.rules = e.value, this.saveRules(), this.dispatchEvent(new CustomEvent("rules-changed", {
      detail: this.rules,
      bubbles: !0
    }));
  }
  loadRules() {
    const i = localStorage.getItem("amv-rules");
    i && (this.rules = i);
  }
  saveRules() {
    localStorage.setItem("amv-rules", this.rules);
  }
  getRules() {
    return this.rules;
  }
};
L.styles = q`
    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }

    textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 1rem;
      resize: vertical;
      min-height: 120px;
      transition: border-color 0.2s;
    }

    textarea:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgb(79 70 229 / 0.1);
    }
  `;
ue([
  S()
], L.prototype, "rules", 2);
L = ue([
  G("rules-manager")
], L);
var Fe = Object.defineProperty, Be = Object.getOwnPropertyDescriptor, U = (i, e, t, s) => {
  for (var r = s > 1 ? void 0 : s ? Be(e, t) : e, o = i.length - 1, n; o >= 0; o--)
    (n = i[o]) && (r = (s ? n(e, t, r) : n(r)) || r);
  return s && r && Fe(e, t, r), r;
};
let b = class extends y {
  constructor() {
    super(...arguments), this.files = [], this.isLoading = !1, this.message = "", this.messageType = "";
  }
  render() {
    return m`
      ${this.message ? m`
        <div class="status-message status-${this.messageType}">
          ${this.message}
        </div>
      ` : ""}

      ${this.files.length === 0 ? m`
        <div class="empty-state">
          <p>No files added yet. Use the file manager above to add files or folders to rename.</p>
        </div>
      ` : m`
        <div class="button-group">
          <button 
            class="btn-primary ${this.isLoading ? "loading" : ""}"
            @click=${this.generateSuggestions}
            ?disabled=${this.isLoading}
          >
            ${this.isLoading ? "Generating..." : "Generate AI Suggestions"}
          </button>
          <button 
            class="btn-success"
            @click=${this.renameFiles}
            ?disabled=${this.isLoading || !this.hasSuggestions()}
          >
            Rename Files
          </button>
          <button 
            class="btn-secondary"
            @click=${this.clearFiles}
            ?disabled=${this.isLoading}
          >
            Clear Files
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Original Name</th>
              <th>Suggested Name</th>
            </tr>
          </thead>
          <tbody>
            ${this.files.map((i) => m`
              <tr>
                <td>${i.isDirectory ? "📁" : "📄"}</td>
                <td>${i.originalName}</td>
                <td>${i.suggestedName || "-"}</td>
              </tr>
            `)}
          </tbody>
        </table>
      `}
    `;
  }
  addFiles(i) {
    this.files = [...this.files, ...i];
  }
  async generateSuggestions() {
    const e = document.querySelector("rules-manager")?.getRules() || "";
    if (!e.trim()) {
      this.showMessage("Please enter some renaming rules first.", "error");
      return;
    }
    this.isLoading = !0, this.clearMessage();
    try {
      const t = await fetch("/api/suggest-names", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          files: this.files,
          rules: e
        })
      });
      if (!t.ok)
        throw new Error(`HTTP ${t.status}: ${t.statusText}`);
      const s = await t.json();
      this.files = s.files, this.showMessage("AI suggestions generated successfully!", "success");
    } catch (t) {
      console.error("Failed to generate suggestions:", t), this.showMessage(`Failed to generate suggestions: ${t instanceof Error ? t.message : "Unknown error"}`, "error");
    } finally {
      this.isLoading = !1;
    }
  }
  async renameFiles() {
    this.isLoading = !0, this.clearMessage();
    try {
      const i = await fetch("/api/rename-files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          files: this.files
        })
      });
      if (!i.ok)
        throw new Error(`HTTP ${i.status}: ${i.statusText}`);
      const e = await i.json(), t = e.results.filter((r) => r.success).length, s = e.results.filter((r) => !r.success).length;
      s === 0 ? (this.showMessage(`Successfully renamed ${t} files!`, "success"), this.files = []) : this.showMessage(`Renamed ${t} files, ${s} failed.`, "error");
    } catch (i) {
      console.error("Failed to rename files:", i), this.showMessage(`Failed to rename files: ${i instanceof Error ? i.message : "Unknown error"}`, "error");
    } finally {
      this.isLoading = !1;
    }
  }
  clearFiles() {
    this.files = [], this.clearMessage();
  }
  hasSuggestions() {
    return this.files.some((i) => i.suggestedName && i.suggestedName !== i.originalName);
  }
  showMessage(i, e) {
    this.message = i, this.messageType = e, setTimeout(() => this.clearMessage(), 5e3);
  }
  clearMessage() {
    this.message = "", this.messageType = "";
  }
};
b.styles = q`
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
    }

    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    th {
      font-weight: 600;
      background-color: var(--background);
      color: var(--text-primary);
    }

    tr:hover {
      background-color: var(--background);
    }

    .button-group {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background-color: var(--primary-color);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: var(--primary-hover);
    }

    .btn-secondary {
      background-color: var(--secondary-color);
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #4b5563;
    }

    .btn-success {
      background-color: var(--success);
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background-color: #059669;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .loading {
      position: relative;
      overflow: hidden;
    }

    .loading::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
      animation: loading 1.5s infinite;
    }

    @keyframes loading {
      0% { left: -100%; }
      100% { left: 100%; }
    }

    .status-message {
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .status-success {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #15803d;
    }

    .status-error {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
    }
  `;
U([
  S()
], b.prototype, "files", 2);
U([
  S()
], b.prototype, "isLoading", 2);
U([
  S()
], b.prototype, "message", 2);
U([
  S()
], b.prototype, "messageType", 2);
b = U([
  G("file-list")
], b);
export {
  b as FileList,
  D as FileManager,
  L as RulesManager
};
