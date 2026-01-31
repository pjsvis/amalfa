# Flexbox Playbook

Based on the [CSS-Tricks Guide to Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/).

## Background
The Flexbox Layout (Flexible Box) module aims to provide a more efficient way to lay out, align and distribute space among items in a container, even when their size is unknown and/or dynamic.

## Terminology
- **Flex Container**: The parent element with `display: flex`.
- **Flex Items**: The direct children of the flex container.
- **Main Axis**: The primary axis along which flex items are laid out (defined by `flex-direction`).
- **Cross Axis**: The axis perpendicular to the main axis.

## Properties for the Parent (Flex Container)

### display
Defines a flex container; inline or block depending on the given value. It enables a flex context for all its direct children.
```css
.container {
  display: flex; /* or inline-flex */
}
```

### flex-direction
Establishes the main-axis, defining the direction flex items are placed in the flex container.
```css
.container {
  flex-direction: row | row-reverse | column | column-reverse;
}
```
- `row` (default): left to right in ltr; right to left in rtl
- `row-reverse`: right to left in ltr; left to right in rtl
- `column`: same as row but top to bottom
- `column-reverse`: same as row-reverse but bottom to top

### flex-wrap
By default, flex items will all try to fit onto one line. You can change that and allow the items to wrap as needed with this property.
```css
.container {
  flex-wrap: nowrap | wrap | wrap-reverse;
}
```
- `nowrap` (default): all flex items will be on one line
- `wrap`: flex items will wrap onto multiple lines, from top to bottom.
- `wrap-reverse`: flex items will wrap onto multiple lines from bottom to top.

### flex-flow
This is a shorthand for the `flex-direction` and `flex-wrap` properties, which together define the flex container's main and cross axes. The default value is `row nowrap`.
```css
.container {
  flex-flow: column wrap;
}
```

### justify-content
This defines the alignment along the main axis. It helps distribute extra free space leftover when either all the flex items on a line are inflexible, or are flexible but have reached their maximum size.
```css
.container {
  justify-content: flex-start | flex-end | center | space-between | space-around | space-evenly | start | end | left | right ... + safe | unsafe;
}
```

### align-items
This defines the default behavior for how flex items are laid out along the cross axis on the current line. Think of it as the `justify-content` version for the cross-axis (perpendicular to the main-axis).
```css
.container {
  align-items: stretch | flex-start | flex-end | center | baseline | first baseline | last baseline | start | end | self-start | self-end + ... safe | unsafe;
}
```

### align-content
This aligns a flex container's lines within when there is extra space in the cross-axis, similar to how `justify-content` aligns individual items within the main-axis.
**Note:** this property has no effect when there is only one line of flex items.
```css
.container {
  align-content: flex-start | flex-end | center | space-between | space-around | space-evenly | stretch | start | end | baseline | first baseline | last baseline + ... safe | unsafe;
}
```

## Properties for the Children (Flex Items)

### order
By default, flex items are laid out in the source order. However, the `order` property controls the order in which they appear in the flex container.
```css
.item {
  order: 5; /* default is 0 */
}
```

### flex-grow
This defines the ability for a flex item to grow if necessary. It accepts a unitless value that serves as a proportion. It dictates what amount of the available space inside the flex container the item should take up.
```css
.item {
  flex-grow: 4; /* default 0 */
}
```

### flex-shrink
This defines the ability for a flex item to shrink if necessary.
```css
.item {
  flex-shrink: 3; /* default 1 */
}
```

### flex-basis
This defines the default size of an element before the remaining space is distributed. It can be a length (e.g. 20%, 5rem, etc.) or a keyword.
```css
.item {
  flex-basis:  | auto; /* default auto */
}
```

### flex
This is the shorthand for `flex-grow`, `flex-shrink` and `flex-basis` combined. The second and third parameters (`flex-shrink` and `flex-basis`) are optional. The default is `0 1 auto`, but if you set it with a single number value, it's like `1 0`.
**It is recommended that you use this shorthand property** rather than set the individual properties. The shorthand sets the other values intelligently.
```css
.item {
  flex: none | [ <'flex-grow'> <'flex-shrink'>? || <'flex-basis'> ]
}
```

### align-self
This allows the default alignment (or the one specified by `align-items`) to be overridden for individual flex items.
```css
.item {
  align-self: auto | flex-start | flex-end | center | baseline | stretch;
}
```
