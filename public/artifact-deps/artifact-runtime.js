/**
 * Artifact iframe runtime — sets up window.__artifactRequire with:
 * - Core React packages
 * - recharts / lucide-react (UMD globals set by their respective script tags)
 * - Minimal shadcn/ui component stubs (Button, Card, Badge, Input, Alert, Tabs,
 *   Table, Separator, Progress, Switch, Checkbox, Slider, Select, Label)
 *
 * All components use React.createElement + Tailwind CSS classes so no
 * additional bundler or CSS-in-JS runtime is needed inside the iframe.
 */
(function () {
  'use strict';

  var h = React.createElement;
  var forwardRef = React.forwardRef;
  var useState = React.useState;
  var useContext = React.useContext;
  var createContext = React.createContext;

  var cn = function () {
    var args = Array.prototype.slice.call(arguments);
    return args.filter(Boolean).join(' ');
  };

  // ─── Button ─────────────────────────────────────────────────────────────────
  var Button = forwardRef(function Button(props, ref) {
    var className = props.className,
      _variant = props.variant || 'default',
      _size = props.size || 'default',
      children = props.children,
      rest = Object.assign({}, props);
    delete rest.className;
    delete rest.variant;
    delete rest.size;
    delete rest.children;

    var variants = {
      default: 'bg-slate-900 text-slate-50 hover:bg-slate-800',
      destructive: 'bg-red-500 text-white hover:bg-red-600',
      outline: 'border border-slate-200 bg-white hover:bg-slate-100',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
      ghost: 'hover:bg-slate-100 hover:text-slate-900',
      link: 'text-slate-900 underline-offset-4 hover:underline p-0 h-auto',
    };
    var sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3 text-xs',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };
    return h(
      'button',
      Object.assign({ ref: ref }, rest, {
        className: cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50',
          variants[_variant] || variants.default,
          sizes[_size] || sizes.default,
          className,
        ),
      }),
      children,
    );
  });

  // ─── Card ────────────────────────────────────────────────────────────────────
  var Card = forwardRef(function Card(p, ref) {
    return h(
      'div',
      Object.assign({}, p, {
        ref: ref,
        className: cn(
          'rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm',
          p.className,
        ),
      }),
    );
  });
  var CardHeader = forwardRef(function CardHeader(p, ref) {
    return h(
      'div',
      Object.assign({}, p, {
        ref: ref,
        className: cn('flex flex-col space-y-1.5 p-6', p.className),
      }),
    );
  });
  var CardTitle = forwardRef(function CardTitle(p, ref) {
    return h(
      'h3',
      Object.assign({}, p, {
        ref: ref,
        className: cn('text-2xl font-semibold leading-none tracking-tight', p.className),
      }),
    );
  });
  var CardDescription = forwardRef(function CardDescription(p, ref) {
    return h(
      'p',
      Object.assign({}, p, { ref: ref, className: cn('text-sm text-slate-500', p.className) }),
    );
  });
  var CardContent = forwardRef(function CardContent(p, ref) {
    return h('div', Object.assign({}, p, { ref: ref, className: cn('p-6 pt-0', p.className) }));
  });
  var CardFooter = forwardRef(function CardFooter(p, ref) {
    return h(
      'div',
      Object.assign({}, p, { ref: ref, className: cn('flex items-center p-6 pt-0', p.className) }),
    );
  });

  // ─── Badge ───────────────────────────────────────────────────────────────────
  var Badge = function Badge(p) {
    var variants = {
      default: 'bg-slate-900 text-slate-50 hover:bg-slate-800',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
      destructive: 'bg-red-500 text-white',
      outline: 'border border-slate-200 text-slate-950',
    };
    var rest = Object.assign({}, p);
    delete rest.variant;
    return h(
      'div',
      Object.assign({}, rest, {
        className: cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
          variants[p.variant || 'default'],
          p.className,
        ),
      }),
    );
  };

  // ─── Input ───────────────────────────────────────────────────────────────────
  var Input = forwardRef(function Input(p, ref) {
    return h(
      'input',
      Object.assign({}, p, {
        ref: ref,
        className: cn(
          'flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          p.className,
        ),
      }),
    );
  });

  // ─── Label ───────────────────────────────────────────────────────────────────
  var Label = forwardRef(function Label(p, ref) {
    return h(
      'label',
      Object.assign({}, p, {
        ref: ref,
        className: cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          p.className,
        ),
      }),
    );
  });

  // ─── Alert ───────────────────────────────────────────────────────────────────
  var Alert = forwardRef(function Alert(p, ref) {
    var v = { default: 'bg-white text-slate-950', destructive: 'border-red-500/50 text-red-600' };
    var rest = Object.assign({}, p);
    delete rest.variant;
    return h(
      'div',
      Object.assign({}, rest, {
        ref: ref,
        role: 'alert',
        className: cn(
          'relative w-full rounded-lg border border-slate-200 p-4',
          v[p.variant || 'default'],
          p.className,
        ),
      }),
    );
  });
  var AlertTitle = forwardRef(function AlertTitle(p, ref) {
    return h(
      'h5',
      Object.assign({}, p, {
        ref: ref,
        className: cn('mb-1 font-medium leading-none tracking-tight', p.className),
      }),
    );
  });
  var AlertDescription = forwardRef(function AlertDescription(p, ref) {
    return h(
      'div',
      Object.assign({}, p, {
        ref: ref,
        className: cn('text-sm [&_p]:leading-relaxed', p.className),
      }),
    );
  });

  // ─── Separator ───────────────────────────────────────────────────────────────
  var Separator = forwardRef(function Separator(p, ref) {
    var orientation = p.orientation || 'horizontal';
    var rest = Object.assign({}, p);
    delete rest.orientation;
    delete rest.decorative;
    return h(
      'div',
      Object.assign({}, rest, {
        ref: ref,
        role: p.decorative === false ? 'separator' : 'none',
        className: cn(
          'shrink-0 bg-slate-200',
          orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
          p.className,
        ),
      }),
    );
  });

  // ─── Progress ────────────────────────────────────────────────────────────────
  var Progress = forwardRef(function Progress(p, ref) {
    var rest = Object.assign({}, p);
    delete rest.value;
    return h(
      'div',
      Object.assign({}, rest, {
        ref: ref,
        className: cn('relative h-4 w-full overflow-hidden rounded-full bg-slate-100', p.className),
      }),
      h('div', {
        className: 'h-full bg-slate-900 transition-all',
        style: { width: (p.value || 0) + '%' },
      }),
    );
  });

  // ─── Tabs ────────────────────────────────────────────────────────────────────
  var TabsCtx = createContext({ onChange: function () {}, value: '' });
  var Tabs = function Tabs(p) {
    var val = useState(p.defaultValue || '');
    var active = p.value !== undefined ? p.value : val[0];
    var setActive = val[1];
    var handleChange = function (v) {
      setActive(v);
      p.onValueChange && p.onValueChange(v);
    };
    var rest = Object.assign({}, p);
    delete rest.defaultValue;
    delete rest.value;
    delete rest.onValueChange;
    return h(
      TabsCtx.Provider,
      { value: { onChange: handleChange, value: active } },
      h('div', rest),
    );
  };
  var TabsList = forwardRef(function TabsList(p, ref) {
    return h(
      'div',
      Object.assign({}, p, {
        ref: ref,
        className: cn(
          'inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500',
          p.className,
        ),
      }),
    );
  });
  var TabsTrigger = forwardRef(function TabsTrigger(p, ref) {
    var ctx = useContext(TabsCtx);
    var isActive = ctx.value === p.value;
    var rest = Object.assign({}, p);
    delete rest.value;
    return h(
      'button',
      Object.assign({}, rest, {
        ref: ref,
        type: 'button',
        className: cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
          isActive ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900',
          p.className,
        ),
        onClick: function () {
          ctx.onChange(p.value);
        },
      }),
    );
  });
  var TabsContent = forwardRef(function TabsContent(p, ref) {
    var ctx = useContext(TabsCtx);
    if (ctx.value !== p.value) return null;
    var rest = Object.assign({}, p);
    delete rest.value;
    return h(
      'div',
      Object.assign({}, rest, {
        ref: ref,
        className: cn('mt-2 focus-visible:outline-none', p.className),
      }),
    );
  });

  // ─── Table ───────────────────────────────────────────────────────────────────
  var Table = forwardRef(function Table(p, ref) {
    return h(
      'div',
      { className: 'relative w-full overflow-auto' },
      h(
        'table',
        Object.assign({}, p, {
          ref: ref,
          className: cn('w-full caption-bottom text-sm', p.className),
        }),
      ),
    );
  });
  var TableHeader = forwardRef(function TableHeader(p, ref) {
    return h(
      'thead',
      Object.assign({}, p, { ref: ref, className: cn('[&_tr]:border-b', p.className) }),
    );
  });
  var TableBody = forwardRef(function TableBody(p, ref) {
    return h(
      'tbody',
      Object.assign({}, p, { ref: ref, className: cn('[&_tr:last-child]:border-0', p.className) }),
    );
  });
  var TableFooter = forwardRef(function TableFooter(p, ref) {
    return h(
      'tfoot',
      Object.assign({}, p, {
        ref: ref,
        className: cn('bg-slate-900 font-medium text-slate-50', p.className),
      }),
    );
  });
  var TableRow = forwardRef(function TableRow(p, ref) {
    return h(
      'tr',
      Object.assign({}, p, {
        ref: ref,
        className: cn(
          'border-b border-slate-100 transition-colors hover:bg-slate-50/50',
          p.className,
        ),
      }),
    );
  });
  var TableHead = forwardRef(function TableHead(p, ref) {
    return h(
      'th',
      Object.assign({}, p, {
        ref: ref,
        className: cn('h-12 px-4 text-left align-middle font-medium text-slate-500', p.className),
      }),
    );
  });
  var TableCell = forwardRef(function TableCell(p, ref) {
    return h(
      'td',
      Object.assign({}, p, { ref: ref, className: cn('p-4 align-middle', p.className) }),
    );
  });
  var TableCaption = forwardRef(function TableCaption(p, ref) {
    return h(
      'caption',
      Object.assign({}, p, { ref: ref, className: cn('mt-4 text-sm text-slate-500', p.className) }),
    );
  });

  // ─── Switch ──────────────────────────────────────────────────────────────────
  var Switch = forwardRef(function Switch(p, ref) {
    var s = useState(p.defaultChecked || false);
    var on = p.checked !== undefined ? p.checked : s[0];
    var toggle = function () {
      var next = !on;
      s[1](next);
      p.onCheckedChange && p.onCheckedChange(next);
    };
    var rest = Object.assign({}, p);
    delete rest.checked;
    delete rest.defaultChecked;
    delete rest.onCheckedChange;
    return h(
      'button',
      Object.assign({}, rest, {
        'ref': ref,
        'type': 'button',
        'role': 'switch',
        'aria-checked': on,
        'className': cn(
          'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          on ? 'bg-slate-900' : 'bg-slate-200',
          p.className,
        ),
        'onClick': toggle,
      }),
      h('span', {
        className: cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
          on ? 'translate-x-5' : 'translate-x-0',
        ),
      }),
    );
  });

  // ─── Checkbox ────────────────────────────────────────────────────────────────
  var Checkbox = forwardRef(function Checkbox(p, ref) {
    var s = useState(p.defaultChecked || false);
    var on = p.checked !== undefined ? p.checked : s[0];
    var toggle = function () {
      var next = !on;
      s[1](next);
      p.onCheckedChange && p.onCheckedChange(next);
    };
    var rest = Object.assign({}, p);
    delete rest.checked;
    delete rest.defaultChecked;
    delete rest.onCheckedChange;
    return h(
      'button',
      Object.assign({}, rest, {
        'ref': ref,
        'type': 'button',
        'role': 'checkbox',
        'aria-checked': on,
        'className': cn(
          'peer h-4 w-4 shrink-0 rounded-sm border border-slate-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          on ? 'bg-slate-900 text-white' : 'bg-white',
          p.className,
        ),
        'onClick': toggle,
      }),
      on
        ? h(
            'svg',
            {
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 3,
              className: 'h-4 w-4',
            },
            h('polyline', { points: '20 6 9 17 4 12' }),
          )
        : null,
    );
  });

  // ─── Slider ──────────────────────────────────────────────────────────────────
  var Slider = forwardRef(function Slider(p, ref) {
    var min = p.min || 0,
      max = p.max || 100,
      step = p.step || 1;
    var s = useState(p.defaultValue ? p.defaultValue[0] : 50);
    var val = p.value !== undefined ? p.value[0] : s[0];
    var rest = Object.assign({}, p);
    delete rest.min;
    delete rest.max;
    delete rest.step;
    delete rest.value;
    delete rest.defaultValue;
    delete rest.onValueChange;
    return h(
      'div',
      Object.assign({}, rest, {
        ref: ref,
        className: cn('relative flex w-full touch-none select-none items-center', p.className),
      }),
      h('input', {
        type: 'range',
        min: min,
        max: max,
        step: step,
        value: val,
        className: 'w-full accent-slate-900',
        onChange: function (e) {
          var v = Number(e.target.value);
          s[1](v);
          p.onValueChange && p.onValueChange([v]);
        },
      }),
    );
  });

  // ─── Select ──────────────────────────────────────────────────────────────────
  var SelectCtx = createContext({
    onChange: function () {},
    open: false,
    setOpen: function () {},
    value: '',
  });
  var Select = function Select(p) {
    var s = useState(p.defaultValue || '');
    var o = useState(false);
    var val = p.value !== undefined ? p.value : s[0];
    var handleChange = function (v) {
      s[1](v);
      p.onValueChange && p.onValueChange(v);
    };
    return h(
      SelectCtx.Provider,
      { value: { onChange: handleChange, open: o[0], setOpen: o[1], value: val } },
      p.children,
    );
  };
  var SelectTrigger = forwardRef(function SelectTrigger(p, ref) {
    var ctx = useContext(SelectCtx);
    return h(
      'button',
      Object.assign({}, p, {
        ref: ref,
        type: 'button',
        className: cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50',
          p.className,
        ),
        onClick: function () {
          ctx.setOpen(!ctx.open);
        },
      }),
      p.children,
      h(
        'svg',
        {
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          className: 'h-4 w-4 opacity-50 ml-auto flex-shrink-0',
        },
        h('polyline', { points: '6 9 12 15 18 9' }),
      ),
    );
  });
  var SelectValue = function SelectValue(p) {
    var ctx = useContext(SelectCtx);
    return h('span', {}, ctx.value || p.placeholder || '');
  };
  var SelectContent = function SelectContent(p) {
    var ctx = useContext(SelectCtx);
    if (!ctx.open) return null;
    var rest = Object.assign({}, p);
    delete rest.className;
    return h(
      'div',
      Object.assign({}, rest, {
        className: cn(
          'absolute z-50 min-w-full overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950 shadow-md mt-1',
          p.className,
        ),
      }),
      h('div', { className: 'p-1' }, p.children),
    );
  };
  var SelectItem = forwardRef(function SelectItem(p, ref) {
    var ctx = useContext(SelectCtx);
    var isSelected = ctx.value === p.value;
    var rest = Object.assign({}, p);
    delete rest.value;
    return h(
      'div',
      Object.assign({}, rest, {
        ref: ref,
        className: cn(
          'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100',
          isSelected ? 'bg-slate-100' : '',
          p.className,
        ),
        onClick: function () {
          ctx.onChange(p.value);
          ctx.setOpen(false);
        },
      }),
      isSelected
        ? h(
            'span',
            { className: 'absolute left-2 flex h-3.5 w-3.5 items-center justify-center' },
            h(
              'svg',
              {
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 3,
                className: 'h-4 w-4',
              },
              h('polyline', { points: '20 6 9 17 4 12' }),
            ),
          )
        : null,
      p.children,
    );
  });

  // ─── minimal cva / clsx / tailwind-merge stubs ───────────────────────────────
  var clsx = function () {
    return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
  };

  // ─── Module registry ─────────────────────────────────────────────────────────
  window.__artifactModules = {
    'react': window.React,
    'react-dom': window.ReactDOM,
    'react-dom/client': { createRoot: window.ReactDOM.createRoot.bind(window.ReactDOM) },
    'recharts': window.Recharts,
    'lucide-react': window.LucideReact,
    'clsx': { clsx: clsx, default: clsx },
    'tailwind-merge': { twMerge: clsx, default: clsx },
    'class-variance-authority': {
      cva: function (base, config) {
        return function (opts) {
          var classes = base;
          if (config && config.variants && opts) {
            Object.keys(opts).forEach(function (k) {
              var v = opts[k];
              if (config.variants[k] && config.variants[k][v])
                classes += ' ' + config.variants[k][v];
            });
          }
          if (config && config.defaultVariants && !opts) {
            Object.keys(config.defaultVariants).forEach(function (k) {
              var v = config.defaultVariants[k];
              if (config.variants[k] && config.variants[k][v])
                classes += ' ' + config.variants[k][v];
            });
          }
          return classes;
        };
      },
      cx: clsx,
    },
    '@/components/ui/button': { Button: Button },
    '@/components/ui/card': {
      Card: Card,
      CardContent: CardContent,
      CardDescription: CardDescription,
      CardFooter: CardFooter,
      CardHeader: CardHeader,
      CardTitle: CardTitle,
    },
    '@/components/ui/badge': { Badge: Badge },
    '@/components/ui/input': { Input: Input },
    '@/components/ui/label': { Label: Label },
    '@/components/ui/alert': {
      Alert: Alert,
      AlertDescription: AlertDescription,
      AlertTitle: AlertTitle,
    },
    '@/components/ui/separator': { Separator: Separator },
    '@/components/ui/progress': { Progress: Progress },
    '@/components/ui/tabs': {
      Tabs: Tabs,
      TabsContent: TabsContent,
      TabsList: TabsList,
      TabsTrigger: TabsTrigger,
    },
    '@/components/ui/table': {
      Table: Table,
      TableBody: TableBody,
      TableCaption: TableCaption,
      TableCell: TableCell,
      TableFooter: TableFooter,
      TableHead: TableHead,
      TableHeader: TableHeader,
      TableRow: TableRow,
    },
    '@/components/ui/switch': { Switch: Switch },
    '@/components/ui/checkbox': { Checkbox: Checkbox },
    '@/components/ui/slider': { Slider: Slider },
    '@/components/ui/select': {
      Select: Select,
      SelectContent: SelectContent,
      SelectItem: SelectItem,
      SelectTrigger: SelectTrigger,
      SelectValue: SelectValue,
    },
  };

  window.__artifactRequire = function (mod) {
    if (Object.prototype.hasOwnProperty.call(window.__artifactModules, mod)) {
      return window.__artifactModules[mod];
    }
    console.warn('[artifact-runtime] Unknown module:', mod);
    return {};
  };
})();
