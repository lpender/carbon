/**
 * Copyright IBM Corp. 2016, 2018
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { WarningFilled16 } from '@carbon/icons-react';
import { settings } from 'carbon-components';
import cx from 'classnames';
import Downshift, { useSelect } from 'downshift';
import isEqual from 'lodash.isequal';
import PropTypes from 'prop-types';
import React, { useRef, useState } from 'react';
import ListBox, { PropTypes as ListBoxPropTypes } from '../ListBox';
import { sortingPropTypes } from './MultiSelectPropTypes';
import { defaultItemToString } from './tools/itemToString';
import { defaultSortItems, defaultCompareItems } from './tools/sorting';
import { useSelection } from '../../internal/Selection';
import setupGetInstanceId from '../../tools/setupGetInstanceId';

const { prefix } = settings;
const noop = () => {};
const getInstanceId = setupGetInstanceId();
const {
  ItemClick,
  MenuBlur,
  MenuKeyDownArrowDown,
  MenuKeyDownArrowUp,
  MenuKeyDownEnter,
  MenuKeyDownEscape,
  MenuKeyDownSpaceButton,
  ToggleButtonClick,
} = useSelect.stateChangeTypes;

function MultiSelect({
  className: containerClassName,
  id,
  items,
  itemToString,
  titleText,
  helperText,
  label,
  type,
  size,
  disabled,
  initialSelectedItems,
  sortItems,
  compareItems,
  light,
  invalid,
  invalidText,
  useTitleInItem,
  translateWithId,
  downshiftProps,
  open,
  selectionFeedback,
  onChange,
  direction,
}) {
  const { current: multiSelectInstanceId } = useRef(getInstanceId());
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [isOpen, setIsOpen] = useState(open);
  const [prevOpenProp, setPrevOpenProp] = useState(open);
  const [topItems, setTopItems] = useState([]);
  const {
    selectedItems: controlledSelectedItems,
    onItemChange,
    clearSelection,
  } = useSelection({
    disabled,
    initialSelectedItems,
    onChange,
  });

  const {
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    getItemProps,
    selectedItem: selectedItems,
  } = useSelect({
    ...downshiftProps,
    highlightedIndex,
    isOpen,
    itemToString,
    onStateChange,
    selectedItem: controlledSelectedItems,
    items,
  });

  /**
   * programmatically control this `open` prop
   */
  if (prevOpenProp !== open) {
    setIsOpen(open);
    setPrevOpenProp(open);
  }

  const inline = type === 'inline';
  const wrapperClasses = cx(
    `${prefix}--multi-select__wrapper`,
    `${prefix}--list-box__wrapper`,
    {
      [`${prefix}--multi-select__wrapper--inline`]: inline,
      [`${prefix}--list-box__wrapper--inline`]: inline,
      [`${prefix}--multi-select__wrapper--inline--invalid`]: inline && invalid,
      [`${prefix}--list-box__wrapper--inline--invalid`]: inline && invalid,
    }
  );
  const titleClasses = cx(`${prefix}--label`, {
    [`${prefix}--label--disabled`]: disabled,
  });
  const helperId = !helperText
    ? undefined
    : `multiselect-helper-text-${multiSelectInstanceId}`;
  const labelId = `multiselect-label-${multiSelectInstanceId}`;
  const fieldLabelId = `multiselect-field-label-${multiSelectInstanceId}`;
  const helperClasses = cx(`${prefix}--form__helper-text`, {
    [`${prefix}--form__helper-text--disabled`]: disabled,
  });

  const className = cx(`${prefix}--multi-select`, containerClassName, {
    [`${prefix}--multi-select--invalid`]: invalid,
    [`${prefix}--multi-select--inline`]: inline,
    [`${prefix}--multi-select--selected`]:
      selectedItems && selectedItems.length > 0,
    [`${prefix}--list-box--up`]: direction === 'top',
  });

  const sortOptions = {
    selectedItems: controlledSelectedItems,
    itemToString,
    compareItems,
    locale: 'en',
  };

  if (selectionFeedback === 'fixed') {
    sortOptions.selectedItems = [];
  } else if (selectionFeedback === 'top-after-reopen') {
    sortOptions.selectedItems = topItems;
  }

  function onStateChange(changes) {
    if (changes.isOpen && !isOpen) {
      setTopItems(controlledSelectedItems);
    }

    const { type } = changes;
    switch (type) {
      case ItemClick:
      case MenuKeyDownSpaceButton:
      case MenuKeyDownEnter:
        onItemChange(changes.selectedItem);
        break;
      case MenuKeyDownArrowDown:
      case MenuKeyDownArrowUp:
        setHighlightedIndex(changes.highlightedIndex);
        break;
      case MenuBlur:
      case MenuKeyDownEscape:
        setIsOpen(false);
        setHighlightedIndex(changes.highlightedIndex);
        break;
      case ToggleButtonClick:
        setIsOpen(changes.isOpen || false);
        setHighlightedIndex(changes.highlightedIndex);
        break;
    }
  }

  return (
    <div className={wrapperClasses}>
      {titleText && (
        <label id={labelId} className={titleClasses} {...getLabelProps()}>
          {titleText}
        </label>
      )}
      <ListBox
        id={id}
        type={type}
        size={size}
        className={className}
        disabled={disabled}
        light={light}
        invalid={invalid}
        invalidText={invalidText}
        isOpen={isOpen}>
        {invalid && (
          <WarningFilled16 className={`${prefix}--list-box__invalid-icon`} />
        )}
        <button
          id={id}
          className={`${prefix}--list-box__field`}
          disabled={disabled}
          aria-disabled={disabled}
          {...getToggleButtonProps()}>
          {selectedItems.length > 0 && (
            <ListBox.Selection
              clearSelection={!disabled ? clearSelection : noop}
              selectionCount={selectedItems.length}
              translateWithId={translateWithId}
              disabled={disabled}
            />
          )}
          <span id={fieldLabelId} className={`${prefix}--list-box__label`}>
            {label}
          </span>
          <ListBox.MenuIcon isOpen={isOpen} translateWithId={translateWithId} />
        </button>
        <ListBox.Menu aria-multiselectable="true" {...getMenuProps()}>
          {isOpen &&
            sortItems(items, sortOptions).map((item, index) => {
              const itemProps = getItemProps({
                item,
              });
              const itemText = itemToString(item);
              const isChecked =
                selectedItems.filter((selected) => isEqual(selected, item))
                  .length > 0;
              return (
                <ListBox.MenuItem
                  aria-selected={isChecked}
                  key={itemProps.id}
                  isActive={isChecked}
                  isHighlighted={highlightedIndex === index}
                  title={itemText}
                  {...itemProps}>
                  <div className={`${prefix}--checkbox-wrapper`}>
                    <span
                      title={useTitleInItem ? itemText : null}
                      className={`${prefix}--checkbox-label`}
                      data-contained-checkbox-state={isChecked}
                      id={`${itemProps.id}__checkbox`}>
                      {itemText}
                    </span>
                  </div>
                </ListBox.MenuItem>
              );
            })}
        </ListBox.Menu>
      </ListBox>
      {!inline && !invalid && helperText && (
        <div id={helperId} className={helperClasses}>
          {helperText}
        </div>
      )}
    </div>
  );
}

MultiSelect.propTypes = {
  ...sortingPropTypes,

  /**
   * Disable the control
   */
  disabled: PropTypes.bool,

  /**
   * Specify a custom `id`
   */
  id: PropTypes.string.isRequired,

  /**
   * We try to stay as generic as possible here to allow individuals to pass
   * in a collection of whatever kind of data structure they prefer
   */
  items: PropTypes.array.isRequired,

  /**
   * Allow users to pass in arbitrary items from their collection that are
   * pre-selected
   */
  initialSelectedItems: PropTypes.array,

  /**
   * Helper function passed to downshift that allows the library to render a
   * given item to a string label. By default, it extracts the `label` field
   * from a given item to serve as the item label in the list.
   */
  itemToString: PropTypes.func,

  /**
   * Generic `label` that will be used as the textual representation of what
   * this field is for
   */
  label: PropTypes.node.isRequired,

  /**
   * Specify the locale of the control. Used for the default `compareItems`
   * used for sorting the list of items in the control.
   */
  locale: PropTypes.string,

  /**
   * `onChange` is a utility for this controlled component to communicate to a
   * consuming component what kind of internal state changes are occuring.
   */
  onChange: PropTypes.func,

  /**
   * Specify 'inline' to create an inline multi-select.
   */
  type: PropTypes.oneOf(['default', 'inline']),

  /**
   * Specify the size of the ListBox. Currently supports either `sm`, `lg` or `xl` as an option.
   */
  size: ListBoxPropTypes.ListBoxSize,

  /**
   * Specify title to show title on hover
   */
  useTitleInItem: PropTypes.bool,

  /**
   * `true` to use the light version.
   */
  light: PropTypes.bool,

  /**
   * Is the current selection invalid?
   */
  invalid: PropTypes.bool,

  /**
   * If invalid, what is the error?
   */
  invalidText: PropTypes.string,

  /**
   * Initialize the component with an open(`true`)/closed(`false`) menu.
   */
  open: PropTypes.bool,

  /**
   * Callback function for translating ListBoxMenuIcon SVG title
   */
  translateWithId: PropTypes.func,

  /**
   * Specify feedback (mode) of the selection.
   * `top`: selected item jumps to top
   * `fixed`: selected item stays at it's position
   * `top-after-reopen`: selected item jump to top after reopen dropdown
   */
  selectionFeedback: PropTypes.oneOf(['top', 'fixed', 'top-after-reopen']),

  /**
   * Additional props passed to Downshift
   */
  downshiftProps: PropTypes.shape(Downshift.propTypes),

  /**
   * Specify the direction of the multiselect dropdown. Can be either top or bottom.
   */
  direction: PropTypes.oneOf(['top', 'bottom']),
};

MultiSelect.defaultProps = {
  compareItems: defaultCompareItems,
  disabled: false,
  locale: 'en',
  itemToString: defaultItemToString,
  initialSelectedItems: [],
  sortItems: defaultSortItems,
  type: 'default',
  light: false,
  title: false,
  open: false,
  selectionFeedback: 'top-after-reopen',
  direction: 'bottom',
};

export default MultiSelect;
