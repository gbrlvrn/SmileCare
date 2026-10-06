import { Form, InputGroup } from 'react-bootstrap';
import { Search, XLg } from 'react-bootstrap-icons';

/**
 * Search input with a magnifier icon and a clear button.
 * Pair it with useListQuery: <SearchBar value={list.search} onChange={list.setSearch} />
 * @param {object} props
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange receives the new text (not the event)
 * @param {string} [props.placeholder='Search…']
 * @param {string} [props.ariaLabel] defaults to the placeholder
 * @param {string} [props.className]
 */
export default function SearchBar({ value, onChange, placeholder = 'Search…', ariaLabel, className = '' }) {
  return (
    <InputGroup className={`sc-search ${className}`}>
      <InputGroup.Text aria-hidden="true">
        <Search />
      </InputGroup.Text>
      <Form.Control
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
      />
      {value && (
        <button type="button" className="btn sc-search-clear" onClick={() => onChange('')} aria-label="Clear search">
          <XLg size={12} />
        </button>
      )}
    </InputGroup>
  );
}
