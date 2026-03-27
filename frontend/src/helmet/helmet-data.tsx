import React from 'react';
import { Helmet } from 'react-helmet-async';

export const HelmetData: React.FC = () => (
    <Helmet>
        <meta
            name="description"
            content="Free and Open-source database diagrams editor, visualize and design your database with a single query. Tool to help you draw your DB relationship diagrams and export DDL scripts."
        />
        <meta property="og:type" content="website" />
        <meta
            property="og:title"
            content="SchemaDash - Database schema diagrams visualizer"
        />
        <meta
            property="og:description"
            content="Free and Open-source database diagrams editor, visualize and design your database with a single query. Tool to help you draw your DB relationship diagrams and export DDL scripts."
        />
        <meta
            property="og:image"
            content="https://app.schemadash.io/schemadash.png"
        />
        <meta property="og:url" content="https://app.schemadash.io" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
            name="twitter:title"
            content="SchemaDash - Database schema diagrams visualizer"
        />
        <meta
            name="twitter:description"
            content="Free and Open-source database diagrams editor, visualize and design your database with a single query. Tool to help you draw your DB relationship diagrams and export DDL scripts."
        />
        <meta
            name="twitter:image"
            content="https://github.com/wweziz0001/SchemaDash/raw/main/public/schemadash.png"
        />
        <title>SchemaDash - Database schema diagrams visualizer</title>
    </Helmet>
);
