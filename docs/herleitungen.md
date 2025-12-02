# Die Idee

Die Simulation besteht aus 3 Hauptelementen:

- Großes rechteckiges Gebiet (äußere Platte)
- Kleines rechteckiges Gebiet (innere Platte)
- kleiner heißer Fleck (lokale Heizung)

**Das Setup** dieser Elemente ist wie folgt aufgebaut: Das große Rechteck umschließt das kleinere Rechteck und zusammen bilden beide die Verbundplatte. Auf dieser Verbundplatte wird es einen heißen Punkt geben, bei dem die Wärme eingespeist wird. Die beiden Platten bestehen aus 2 unterschiedlichen Materialien (z. B. Material A, Material B), welche jeweils unterschiedliche Wärmeleitfähigkeit haben.

**Die Visualisierung** wird eine 2D-Heatmap (z. B. Farbkarte von $T(x,y,t)$) zeigen, bei der der Nutzer sieht, wie sich die Wärmewelle ausbreitet und sich das Muster ändert, wenn diese auf das kleinere Rechteck (Material B) trifft. 

**Die Simulation** kann vom Nutzer beeinflusst werden, indem er folgende Änderungen an den Simulations-Elementen macht:  
(a) Verändern der Materialien (A,B),  
(b) Verändern der Stärke der eingespeisten Hitze und  
(c) Positionsänderung der lokalen Heizung.

---

# Die Simulation

## Definition: Geometrie

Wir simulieren eine **2D-Platte** mit einem **rechteckigen Einschluss** und einer **lokalen Heizregion** in der 2D-Platte. Namen werden wie folgt definiert:

- **2D-Platte** := `main-area` (Material A)  
- **rechteckiger Einschluss** := `inclusion-area` (Material B)  
- **lokale Heizregion** := `hotspot`

### Koordinatensystem

- Koordinaten: $x$ in horizontaler Richtung, $y$ in vertikaler Richtung.
- Simulationsgebiet: $\Omega = [0,L_x] \times [0,L_y]$
- Beispielwerte: $L_x = 0{,}1\,\text{m}$, $L_y = 0{,}1\,\text{m}$

Da wir 2D simulieren, wird die Platte als dünn in $z$-Richtung angenommen. Dadurch kann die Temperaturveränderung über die Dicke vernachlässigt werden. Also die klassische 2D-Approximation in der Wärmeleitung (Plane Wall Model) \cite{wikiInklusion}.

### Rechteckiger Einschluss (sec-area)

Im Inneren der Simulationsfläche liegt das kleinere Rechteck $\Omega_{\text{inc}}$. Dieses besteht aus einem anderen Material und wird definiert als:
\[
\Omega_{\text{inc}} = [x_1,x_2] \times [y_1,y_2]
\]

mit beispielsweise:

- $x_1 = 0{,}04\,\text{m}$
- $x_2 = 0{,}06\,\text{m}$
- $y_1 = 0{,}04\,\text{m}$
- $y_2 = 0{,}06\,\text{m}$

Also haben wir für die Gebiete:

- **main-area** (Material A): $\Omega_A = \dfrac{\Omega}{\Omega_{\text{inc}}}$
- **sec-area** (Material B): $\Omega_B = \Omega_{\text{inc}}$

### Lokale Heizregion (hotspot)

Eine Punktquelle ist numerisch schwer darzustellen, deshalb wird in der Simulation eine kleine, aber endliche Heizfläche $\Omega_h$ um den Punkt $(x_h, y_h)$ simuliert. Also für die Simulation haben wir:

- Mittelpunkt der Heizregion: $(x_h,y_h)$  
- Heizbereich als kleineres Quadrat:  
  \[
  \Omega_h = [x_h - \Delta_h, x_h + \Delta_h] \times [y_h - \Delta_h, y_h + \Delta_h]
  \]
- Beispielsweise: $(x_h,y_h) = (0{,}02\,\text{m}, 0{,}05\,\text{m})$
- Beispielsweise: $\Delta_h = 0{,}0025\,\text{m}$ (5 mm × 5 mm Quadrat)

In der Numerik entspricht das ein paar Gitterpunkten, in denen ein volumetrischer Wärmeerzeugungsterm $\dot{q}(x,y,t)$ ungleich 0 ist. 

## Materialien & Parameter
\label{sec:materials}

Es wird eine Auswahl von 10 unterschiedlichen Materialien geben. 

**Tabelle: Thermophysikalische Eigenschaften ausgewählter Materialien**  
\label{tab:materials}

| Material    | Wärmeleitfähigkeit $k$ [W/(m·K)] | Wärmekapazität $c_p$ [J/(kg·K)] | Dichte $\rho$ [kg/m³] |
|------------|-----------------------------------|----------------------------------|------------------------|
| Diamond    | 1000      | 506        | 3500        |
| Silver     | 426.77    | 236        | 10500       |
| Copper     | 397.48    | 385        | 8940        |
| Gold       | 317.98    | 128        | 19300       |
| Aluminium  | 225.94    | 921        | 2698        |
| Bronze     | 54.392    | 377        | 8750        |
| Basalt     | 2.55      | 627--950   | 2700--3000  |
| Water      | 0.6       | 4181       | 997.05      |
| Fiberglass | 0.176     | 1130       | 1230        |
| Air        | 0.0025    | 1004       | 1.29        |

Die Materialwerte wurden aus folgenden Seiten entnommen \cite{matmakeSpecificHeatCapa, wikiConductivities, thermtestMaterials}. Es wird anfangs ein festgelegtes Setup genommen, später erweiterbar mit mehreren Materialien. 

- Main (Material A): Basalt (schlechte Wärmeleitung)
- Inclusion (Material B): Aluminium (gute Wärmeleitung)

## Thermische Diffusivität

Für den Wärmetransport ist die thermische Diffusivität wichtig. Sie kann als zeitliche Ableitung der Temperatur eines Materials betrachtet werden und beschreibt damit die Geschwindigkeit, mit der die Wärmeausbreitung in einem Material "abnimmt/geglättet" wird. Damit können zwei Materialien und ihre Wärmeleitfähigkeit gut verglichen werden. Folgende Formel beschreibt die thermische Diffusivität \cite{wikiTermal}: 

\begin{equation}
    \alpha = \frac{k}{\rho * c_p}
\end{equation}

Nehmen wir die beiden Materialien aus Abschnitt *Materialien & Parameter*, erhalten wir mit den Werten aus der Tabelle der Materialien folgende Rechnungen:

$
    \alpha_A &\approx \frac{2.55\,\text{W}/(\text{m K})}{3000\,\text{kg}/\text{m}^3 * 950\,\text{J}/(\text{kg K})} \approx 8.95 \times 10^{-7}\,\text{m}^2/\text{s} \\
    \alpha_B &\approx \frac{225\,\text{W}/(\text{m K})}{2700\,\text{kg}/\text{m}^3 * 920\,\text{J}/(\text{kg K})} \approx 1.027 \times 10^{-4}\,\text{m}^2/\text{s} \\
    \alpha_B &> \alpha_A
$

Also ist die Ausbreitungsgeschwindigkeit von Wärme in Aluminium um ein Vielfaches höher als in Basalt, was auch in der Simulation zu sehen sein wird. Die Simulation speichert dann für jede Zelle: 

$
    k_{i,j}, \rho_{i,j}, c_{p_{i,j}}
$

---

# Partial Differential Equation (PDE) & Rand-/Anfangsbedingungen
\label{ch:pde}

## Herleitung der 2D-Wärmeleitungsgleichung
\label{sec:pde-3.1}

Die Herleitung der Wärmeleitungsgleichung basiert auf dem _Fourier'schen Gesetz_ und der lokalen Energieerhaltung. Für ein isotropes Medium mit konstanter Wärmeleitfähigkeit $k$, Dichte $\rho$ und Wärmekapazität $c_p$ gilt:

### Schritt 1: Fourier'sches Gesetz

Der Wärmeflussvektor ist proportional zum negativen Temperaturgradienten:

\begin{equation}
    \mathbf{q}(x,y,t) = -k \nabla T(x,y,t),
\end{equation}

wobei $\nabla T = \left(\frac{\partial T}{\partial x}, \frac{\partial T}{\partial y}\right)$ der Temperaturgradient ist.

### Schritt 2: Energieerhaltung

Die zeitliche Änderung der inneren Energie pro Volumen ist gleich der Divergenz des Wärmeflusses plus einer volumetrischen Wärmequelle $\dot{q}_V(x,y,t)$:

\begin{equation}
    \rho c_p \frac{\partial T}{\partial t} = -\nabla \cdot \mathbf{q} + \dot{q}_V(x,y,t).
\end{equation}

### Schritt 3: Einsetzen des Fourier-Gesetzes

Setzt man $\mathbf{q} = -k \nabla T$ ein, folgt:

\begin{equation}
    \rho c_p \frac{\partial T}{\partial t} = \nabla \cdot \left( k \nabla T \right) + \dot{q}_V(x,y,t).
\end{equation}

### Schritt 4: Vereinfachung für konstantes $k$

Für konstantes $k$ reduziert sich der Divergenzterm zu:

\begin{equation}
    \rho c_p \frac{\partial T}{\partial t} = k \nabla^2 T + \dot{q}_V(x,y,t),
\end{equation}

mit dem Laplace-Operator in 2D:

\begin{equation}
    \nabla^2 T = \frac{\partial^2 T}{\partial x^2} + \frac{\partial^2 T}{\partial y^2}.
\end{equation}

### Schritt 5: Endform der 2D-Wärmeleitungsgleichung

Division durch $\rho c_p$ ergibt die Standardform:

\begin{equation}
    \frac{\partial T}{\partial t} = \alpha \left( \frac{\partial^2 T}{\partial x^2} + \frac{\partial^2 T}{\partial y^2} \right) + \frac{\dot{q}_V(x,y,t)}{\rho c_p},
\end{equation}

wobei die thermische Diffusivität definiert ist als

\begin{equation}
    \alpha = \frac{k}{\rho c_p}.
\end{equation}

\cite{wikiHeatEquation}.

## Wärmequelle (Hotspot)
\label{sec:hotspot}

Wir modellieren $\dot{q}(x,y,t)$ als:

$
    \dot{q}(x, y, t) =
    \begin{cases}
        q_0 & \text{für } (x, y) \in \Omega_h \text{ und } 0 < t < t_{\text{heat}} \\
        0   & \text{sonst}
    \end{cases}
$

Wobei $q_0\,[\text{W}/\text{m}^3]$ die konstante Wärmeerzeugungsrate in der Hotspot-Region ist und $t_{\text{heat}}$ die Dauer der Wärmezufuhr ist. Physikalisch könnte das beispielsweise ein Laser darstellen, der eine kleine Fläche aufheizt, oder ein eingebauter Chip, der Abwärme produziert. 

## Anfangsbedingungen

Zur eindeutigen Lösung müssen Anfangs- und Randbedingungen spezifiziert werden. Wir starten mit einer gleichmäßigen Temperatur, z. B. der Umgebungstemperatur $T_{\text{env}}$: 

$
    T(x,y,0) = T_0 = T_{\text{env}}
$

z. B. $T_{\text{env}} = 293\,\text{K}$ (20 °C).

## Randbedingungen (äußere Kanten)

### Dirichlet-Randbedingung
\label{subsec:dirichlet}

Der Einfachheit halber wird für den Anfang die **Dirichlet-Randbedingung** genommen, die Platte ist an den Rändern mit einem Wärmespeicher mit $T_{\text{env}}$ in Kontakt:

$
    T(x,y,t) = T_{\text{env}} \quad \text{für } (x,y) \in \delta\Omega, t > 0
$

**Physikalische Bedeutung**: Die Temperatur am Rand ist fest vorgegeben und unabhängig vom inneren Verhalten.  

**Beispiel**: Die Platte liegt in einem perfekten Material, das immer die konstante Temperatur $T_{\text{env}}$ hat.  

**Usage**: Vereinfachte „unrealistische“ Simulation. Der Fokus liegt auf Wärmeausbreitung in den Materialien, nicht einem realistischen Modell. 

### Robin-Randbedingung (konvektiv)

Für eine realistische Simulation, bei der die Umgebung der Platte auch eine Rolle spielt, kann die konvektive Randbedingung genommen werden:

$
    -k \delta_n T = h (T - T_{\text{env}})
$

mit:

- $h$: Wärmeübergangskoeffizient $[\text{W}/(\text{m}^2\text{K})]$
- $T_{\text{env}}$: Umgebungstemperatur

**Physikalische Bedeutung**: Der Wärmefluss am Rand ist proportional (abhängig) zur Temperaturdifferenz zwischen der Platte und der Umgebung.  

**Beispiel**: Die Platte wird von außen durch ein Material heruntergekühlt, dessen Temperatur aber von der Platte selbst beeinflusst wird.  

**Usage**: Realistische Simulation, bei der die Temperatur am Rand nicht fix ist, sondern durch Austausch mit der Umgebung bestimmt wird. Man will gleichzeitig simulieren, wie sich die Wärmeausbreitung auf der Platte verhält, wenn sich diese in unterschiedlichen Umgebungen befindet.

## Zusatz: Thermische Energie
\label{sec:thermische-energie}

Neben der Temperaturverteilung $T(x,y,t)$ kann in der Simulation auch gut gezeigt werden, wie sich die Gesamtenergie des Systems verändert – je nachdem, welche Randbedingung anliegt und aus welchen Materialien die Platte besteht. Die Formel für die **thermische Energie $E(t)$** lässt sich mit der bereits hergeleiteten Wärmeleitungsgleichung und dem Prinzip der Energieerhaltung wie folgt herleiten:

### Innere Energie und Energiedichte

Die thermische Energie eines Stoffes ist definiert als \cite{chemieSchuleThermischeEnergie}: 

$ E = c \, m \, T \,,$

wobei:

- $c$: spezifische Wärmekapazität $[\text{J}/(\text{kg K})]$  
- $m$: Masse $[\text{kg}]$  
- $T$: Temperatur $[\text{K}]$

Mit $m = \rho \, V$ (Masse = Dichte × Volumen) ergibt sich für ein Volumenelement $dV$:

$dE = \rho \, c_p \, T \, dV$


wobei:

- $\rho$: Dichte $[\text{kg}/\text{m}^3]$  
- $c_p$: Spezifische Wärmekapazität bei konstantem Druck $[\text{J}/(\text{kg K})]$  
- $T$: Temperatur $[\text{K}]$

Für die Felder in unserer Simulation gilt daher (Energie pro Volumen):

$
    e(x,y,t) = \rho(x,y) \, c_p(x,y) \, T(x,y,t)
$

Für das gesamte Volumen $\Omega$ der Platte erhält man die Gesamtenergie als Integral:

$
    E(t) = \int_\Omega \rho(x,y) c_p(x,y) T(x,y,t) e \, dA
$

Da wir eine 2D-Platte haben, schreiben wir für das Volumen: $dV = e \, dA$, wobei $e$ eine konstante Dicke der Platte ist und $dA = dx \, dy$. (Um relative Veränderungen zu zeigen, wird $e = 1{,}0$ gesetzt, entspricht Energie pro Meter Plattendicke.)

### Lokale → globale Energiebilanz

Um die globale Energiebilanz zu erhalten, wird über das gesamte Volumen $\Omega$ der Formel der lokalen Energieerhaltung (siehe Abschnitt *Herleitung der 2D-Wärmeleitungsgleichung*) integriert:

$
    \rho c_p \frac{\partial T}{\partial t} = \nabla * (k \nabla T) + \dot{q}_V(x,y,t)
$

$
    \int_\Omega \rho c_p \frac{\partial T}{\partial t} \, dV = \int_\Omega \nabla * (k \nabla T) \, dV + \int_\Omega \dot{q}_V \, dV
$

Die linke Seite ist die zeitliche Ableitung der Gesamtenergie:

$
    \frac{dE}{dt} = \int_\Omega \rho c_p \frac{\partial T}{\partial t} \, dV \,.
$

Für den Divergenzterm auf der rechten Seite verwendet man den Gaußschen Integralsatz (Volumenintegral → Oberflächenintegral) \cite{wikiGaussIntegral}:

$
    \int_\Omega \nabla * (k \nabla T) \, dV = \oint_{\partial\Omega} k \nabla T * \vec{n} \, dA \,,
$

wobei $\vec{n}$ der äußere Normalenvektor auf der Randfläche $\partial\Omega$ ist. Damit erhält man für die **globale Energiebilanz** der Platte:

$
    \frac{dE}{dt} = \oint_{\partial\Omega} k \nabla T * \vec{n} \, dA + \oint_{\Omega} \dot{q}_V \, dV
$

- Das Oberflächenintegral beschreibt die Wärmestromleistung über den Rand,  
- das Volumenintegral beschreibt die eingespeiste Leistung durch Volumenquellen.

### Globale Energiebilanz (Robin)

Bei Robin ist der Wärmefluss am Rand gegeben als:

$
    -k \nabla T * \vec{n} = h (T - T_{\text{env}})
$

Auflösen und in den Energiebilanzterm (oben) einsetzen:

$
    k \nabla T * \vec{n} = -h (T - T_{\text{env}})
$

$
    \oint_{\partial\Omega} k \nabla T * \vec{n} \, dA = \oint_{\partial\Omega} (-h (T - T_{\text{env}})) \, dA
$

Wir erhalten für die **globale Energiebilanz (Robin)**:

$
    \frac{dE}{dt} = -\oint_{\partial\Omega} h (T - T_{\text{env}}) \, dA + \oint_\Omega \dot{q}_V \, dV
$

was einfach dargestellt $\dfrac{dE}{dt} = Q_{\text{in}}(t) - Q_{\text{out}}(t)$ ist.

---

# Numerische Lösung mit Finite Differenzen (FTCS)
\label{ch:numerische-lösung}

Zur numerischen Lösung der 2D-Wärmeleitung wird das **explizite Finite-Differenzen-Schema** (Forward Time – Centered Space, FTCS) genommen und auf die Variablen $k(x,y)$, $\rho(x,y)$, $c_p(x,y)$ (Materialwerte) erweitert. Das FTCS ist eine Finite-Differenzen-Methode (FDM). FDM nähert die Ableitungen in der PDE mithilfe endlicher Differenzenausdrücke, die aus Taylorreihenentwicklungen abgeleitet sind, und wandelt die PDE in ein System linear-algebraischer Gleichungen um, das effizient mit iterativen Algorithmen gelöst werden kann \cite{explizitesFTCS}.

## Gitter in Raum und Zeit
\label{sec:gitter}

Es wird ein regelmäßiges Gitter verwendet für:

1. **Raumdiskretisierung**:

   $
        x_i = i \Delta x,\quad i = 0, \dots, N_x
   $
    $
        y_j = j \Delta y,\quad j = 0, \dots, N_y
   $

   mit 

   $
        \Delta x = \frac{L_x}{N_x}, \quad \Delta y = \frac{L_y}{N_y}
   $

2. **Zeitdiskretisierung**:

   $
        t^n = n \Delta t,\quad n = 0,1,2,\dots
   $

Und wir approximieren:

$
    T^n_{i,j} \approx T(x_i, y_j, t^n)
$

Beispielwerte sind: $N_x = N_y = 100 \Rightarrow \Delta x = \Delta y = 10^{-3}\,\text{m}$ (1 mm Raster) und $\Delta t$ wird anhand der Stabilitätsbedingung (siehe Abschnitt *Stabilitätsbedingung (CFL)*) gewählt. Für jeden Gitterpunkt $(i,j)$ werden die Werte des Materials gespeichert ($k_{i,j} = k_A$ oder $k_B$ und die entsprechenden Werte $\rho_{i,j}, c_{p_{i,j}}$):

$
    (k_{i,j}, c_{p_{i,j}}, \rho_{i,j}) =
    \begin{cases}
        (k_A, c_{p,A}, \rho_A), & (x_i, y_i) \in \Omega_A, \\
        (k_B, c_{p,B}, \rho_B), & (x_i, y_i) \in \Omega_B
    \end{cases}
$

Und entsprechend den Hotspot (siehe Abschnitt *Wärmequelle (Hotspot)*):

$
    \dot{q}^n_{i,j} \approx \dot{q}(x_i, y_i, t^n)
$

## Diskretisierung von $\nabla * (k\nabla T)$

Der Operator beschreibt eine Form, die auch bei verschiedenen $k$ in Nachbarzellen sinnvoll ist für 2D:

$
    \nabla * (k \nabla T) = \frac{\partial}{\partial x}\left(k \frac{\partial T}{\partial x}\right) + \frac{\partial}{\partial y}\left(k \frac{\partial T}{\partial y}\right)
$

Damit die ortsabhängige Leitfähigkeit berücksichtigt wird, werden Leitfähigkeiten an den Zellengrenzen als Mittelwerte definiert. Somit ergibt sich das arithmetische Mittel für die vier Kanten in einem Punkt durch:

$
    k_{i+\frac{1}{2},j} = \frac{1}{2}(k_{i+1,j} + k_{i,j}), \quad
    k_{i-\frac{1}{2},j} = \frac{1}{2}(k_{i-1,j} + k_{i,j}), \\
    k_{i,j+\frac{1}{2}} = \frac{1}{2}(k_{i,j+1} + k_{i,j}), \quad
    k_{i,j-\frac{1}{2}} = \frac{1}{2}(k_{i,j-1} + k_{i,j}).
$

Mit den zentralen Differenzen ergibt sich für die Divergenz im Punkt $(i,j)$:

$
    [\nabla * (k \nabla T)]^n_{i,j} \approx 
    \frac{1}{\Delta x}
    \left(
        k_{i+\frac{1}{2},j} \frac{T^n_{i+1,j} - T^n_{i,j}}{\Delta x}
        - k_{i-\frac{1}{2},j} \frac{T^n_{i,j} - T^n_{i-1,j}}{\Delta x}
    \right)
    +
    \frac{1}{\Delta y}
    \left(
        k_{i,j+\frac{1}{2}} \frac{T^n_{i,j+1} - T^n_{i,j}}{\Delta y}
        - k_{i,j-\frac{1}{2}} \frac{T^n_{i,j} - T^n_{i, j-1}}{\Delta y}
    \right)
$

## Explizite Zeitschrittmethode FTCS (Zeitdiskretisierung)

Die PDE (siehe Abschnitt *Herleitung der 2D-Wärmeleitungsgleichung*, dort Formel (3.7)) lautet:

$
    \frac{\partial T}{\partial t} = \alpha \left(\frac{\partial^2 T}{\partial x^2} + \frac{\partial^2 T}{\partial y^2}\right) + \frac{\dot{q}v(x,y,t)}{\rho c_p}
$

Nach Umstellen und vereinfachter Darstellung (unter Berücksichtigung für konstantes $k$) erhalten wir:

$
    \rho_{i,j} c_{p_{i,j}} \frac{\partial T}{\partial t} = \nabla * (k \nabla T) + \dot{q}
$

Die diskrete Zeitableitung wird mit einem Vorwärtsschritt approximiert: 

$
     \left. \frac{\partial T}{\partial t} \right|^{n}_{i,j} \approx \frac{T^{n+1}_{i,j} - T^n_{i,j}}{\Delta t}
$

Einsetzen in (4.15):

$
    \rho_{i,j} c_{p_{i,j}} \frac{T^{n+1}_{i,j} - T^n_{i,j}}{\Delta t}
    = \left[ \nabla * (k \nabla T) \right]^{n}_{i,j} + \dot{q}^{n}_{i,j}
$

Wir erhalten die **Update-Formel** (für innere Punkte ohne Randbedingung):

$
    T^{n+1}_{i,j}
    = T^n_{i,j}
    + \frac{\Delta t}{\rho_{i,j} c_{p_{i,j}}}
      \left(
        [\nabla * (k \nabla T)]^n_{i,j} + \dot{q}^n_{i,j}
      \right) \, ,
$

mit $[\nabla * (k \nabla T)]^n_{i,j}$ aus (4.11).

### Umsetzung der Dirichlet-Randbedingung

Die Dirichlet-Randbedingung (siehe Abschnitt *Dirichlet-Randbedingung*) wird auf dem Gitter durch

\begin{equation}
    T^n_{i,j} = T_{\text{env}} \quad \text{für } i = 0, i = N_x \text{ oder } j = 0, j = N_y,\ \forall n
\end{equation}

umgesetzt und in der numerischen Implementierung nach jedem Zeitschritt explizit gesetzt und nicht durch (4.17) aktualisiert.

### Umsetzung der Robin-Randbedingung

Es wird angenommen, dass die Platte an der Umgebung mit Temperatur $T_{\text{env}}$ durch Konvektion mit Wärmeübergangskoeffizient $h$ gekoppelt ist. Für alle Punkte des äußeren Randes gilt: 

$
    -k_{i,j} \nabla T^n_{i,j} \cdot \vec{n}
    = h (T^{n}_{i,j} - T_{\text{env}}),
    \quad \text{für } i = 0, i = N_x \text{ oder } j = 0, j = N_y,\ \forall n ,
$

anders ausgedrückt:

$
    -k(x,y) \nabla T(x,y,t) \cdot \vec{n}
    = h (T(x,y,t) - T_{\text{env}}),
    \quad (x,y) \in \partial\Omega,\ t > 0 .
$

Für jede Randseite wird die Normale explizit:

- Linker Rand: $x = 0$, Normale $\vec{n} = (-1, 0)$  
- Rechter Rand: $x = L_x$, Normale $\vec{n} = (+1, 0)$  
- Unterer Rand: $y = 0$, Normale $\vec{n} = (0, -1)$  
- Oberer Rand: $y = L_y$, Normale $\vec{n} = (0, +1)$  

Somit ist z. B. der rechte Rand gegeben durch:

$
    \left. -k(x,y)\,\frac{\partial T}{\partial x} \right|_{x=L_x}
    = h \big(T(L_x,y,t) - T_{\text{env}}\big).
$

#### Beispiel Diskretisierung am rechten Rand $x = L_x$ ($i = N_x$)

Betrachten wir den Randknoten $(i = N_x, j)$ und nehmen für die partielle Ableitung $\partial T / \partial x$ eine einseitige Differenz nach innen (1. Ordnung), so erhalten wir:

$
    \left. \frac{\partial T}{\partial x} \right|_{x=L_x}
    \approx \frac{T^n_{N_x,j} - T^n_{N_x-1,j}}{\Delta x}.
$

Damit lautet die diskrete Form der Robin-Randbedingung:

$
    -k_{N_x,j} \frac{T^n_{N_x,j} - T^n_{N_x-1,j}}{\Delta x}
    = h \big(T^n_{N_x,j} - T_{\text{env}}\big).
$

Dies ist eine lineare Beziehung zwischen der Randtemperatur $T^n_{N_x,j}$ und dem Innenwert $T^n_{N_x-1,j}$. Durch Umformen nach der Randtemperatur erhalten wir die **Update-Formel** (rechter Rand mit Robin-Randbedingung):

$
    -k_{N_x,j} T^n_{N_x,j} + k_{N_x,j} T^n_{N_x-1,j}
    = h \Delta x\, T^n_{N_x,j} - h \Delta x\, T_{\text{env}}, \\
    (k_{N_x,j} + h \Delta x)\, T^n_{N_x,j}
    = k_{N_x,j} T^n_{N_x-1,j} + h \Delta x\, T_{\text{env}},
$

also schließlich

$
    T^{n}_{N_x,j}
    = \frac{k_{N_x,j}}{k_{N_x,j} + h \Delta x}\, T^n_{N_x-1,j}
    + \frac{h \Delta x}{k_{N_x,j} + h \Delta x}\, T_{\text{env}}.
$

Analog erhalten wir für die restlichen Seiten:

- **Linker Rand** ($x = 0$, $i = 0$):

  $
      T^{n}_{0,j}
      = \frac{k_{0,j}}{k_{0,j} + h \Delta x} T^{n}_{1,j}
      + \frac{h \Delta x}{k_{0,j} + h \Delta x} T_{\text{env}}.
  $

- **Unterer Rand** ($y = 0$, $j = 0$):

  $
      T^{n}_{i,0}
      = \frac{k_{i,0}}{k_{i,0} + h \Delta y} T^{n}_{i,1}
      + \frac{h \Delta y}{k_{i,0} + h \Delta y} T_{\text{env}}.
  $

- **Oberer Rand** ($y = L_y$, $j = N_y$):

  $
      T^{n}_{i,N_y}
      = \frac{k_{i,N_y}}{k_{i,N_y} + h \Delta y} T^{n}_{i,N_y-1}
      + \frac{h \Delta y}{k_{i,N_y} + h \Delta y} T_{\text{env}}.
  $

## Stabilitätsbedingung (CFL)
\label{sec:stabilität}

Die „Courant-Friedrichs-Lewy-Zahl“ gibt an, um wie viele Zellen sich die Strömung in einem Zeitschritt ausbreiten darf \cite{wikiCFL}. Für das explizite FTCS-Verfahren ist die Schrittweite $\Delta t$ also durch die Stabilitätsbedingung eingeschränkt. Für die lokale thermische Diffusivität

$
    \alpha_{i,j} = \frac{k_{i,j}}{\rho_{i,j} c_{p_{i,j}}}
$

wählen wir 

$
    \Delta t \leq \frac{1}{2} \left( \alpha_{\text{max}}
    \left( \frac{1}{\Delta x^2} + \frac{1}{\Delta y^2} \right)\right)^{-1},
    \quad \alpha_{\text{max}} = \max_{i,j} \alpha_{i,j},
$

um numerische Stabilität sicherzustellen.  
Hinweis: Die Robin-Randbedingung kann die effektive Stabilität etwas beeinflussen, aber im Rahmen bleibt die obige Bedingung ein guter Richtwert.

## Energie auf dem Finite-Differenzen-Gitter

Die diskrete Formel der Energie $E^n$ auf dem Gitter basiert auf der Herleitung der **globalen Energiebilanz** (siehe Abschnitt *Zusatz: Thermische Energie*) und der Definition des Gitters (siehe Abschnitt *Gitter in Raum und Zeit*).

Das Gitter ist definiert als:

$
    x_i = i \Delta x,\quad i = 0,\dots,N_x, \quad
    y_i = i \Delta y,\quad j = 0,\dots,N_y
$

Fügen wir dazu eine Plattendicke $e$ ein, erhalten wir für jedes Gitterelement als kleines Volumen:

$
    \Delta V = e \Delta x \Delta y
$

Die diskrete Approximation der Gesamtenergie zum Zeitschritt $t^n$ ist damit:

$
    E^n \approx \sum_{i=0}^{N_x} \sum_{j=0}^{N_y}
    \rho_{i,j} c_{p_{i,j}} T^n_{i,j} \Delta V
$

Mit der einfachen Annahme $e = 1$ (Energie pro Meter Plattendicke) erhalten wir:

$
    E^n \approx \sum_{i=0}^{N_x} \sum_{j=0}^{N_y}
    \rho_{i,j} c_{p_{i,j}} T^n_{i,j} \Delta x \Delta y
$

Zum Schluss definieren wir die Energiedifferenz zur Anfangsenergie:

$
    \Delta E^n = E^n - E^0.
$
