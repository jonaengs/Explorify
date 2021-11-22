import React from 'react';
import { default as ReactSelect } from "react-select";
import { components } from 'react-select';

const Option = (props) => {
    return (
        <div>
            <components.Option {...props}>
                <input
                    type="checkbox"
                    checked={props.isSelected}
                    onChange={() => null}
                />{" "}
                <label>{props.label}</label>
            </components.Option>
        </div>
    );
};

export class DropdownSelect extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedOption: null,
        };
    }
    handleChange = (selected) => {
        this.setState({
            selectedOption: selected
        });
    };
    render() {
        const { selectedOption } = this.state;
        return (
            <span
                // class="d-inline-block"
                data-toggle="popover"
                data-trigger="focus"
                data-content="Please selecet genre(s)"
            >
                <ReactSelect
                    value={selectedOption}
                    isMulti
                    onChange={this.handleChange}
                    options={genreOptions}
                    component = {{Option}}
                    onChange={this.handleChange}
                    allowSelectAll={true}
                    value={this.state.selectedOption}
                />

            </span>
        )
    }
}

const genreOptions = [
    { value: "Rock", label: "Rock" },
    { value: "Pop Music", label: "Pop Music" },
    { value: "Hip-Hop", label: "Hip-Hop" },
    { value: "Jazz", label: "Jazz" },
    { value: "Blues", label: "Blues" },
    { value: "Country Music", label: "Country Music" },
    { value: "Punk Rock", label: "Punk Rock" },
];