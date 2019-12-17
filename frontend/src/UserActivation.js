import React from 'react';
import { Redirect, withRouter } from "react-router-dom";
import { Helmet } from "react-helmet";

import './UserActivation.css'

class UserActivation extends React.Component {

    constructor(props) {
        super(props);
        this.state = { activated: false };
    }

    async componentDidMount() {
        const activationToken = this.props.match.params.activationToken;
        if (activationToken) {
            await this.props.api.post('/user/activate', {activationToken});
            this.setState({activated: true});
        }
    }

    render() {
        const content = (this.state.activated
            ? <Redirect to="/login" />
            : <div>Activating user account</div>
        );
        return <div>
            <Helmet
                 meta={[
                    { name: 'author', content: "Montaan" },
                ]}>
                    <link rel="canonical" href="https://montaan.com/" />
                    <meta name="description" content="Montaan." />
                    <title>Activating Montaan account</title>
            </Helmet>
            {content}
        </div>;
    }

}

export default withRouter(UserActivation);