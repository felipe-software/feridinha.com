import styled from "styled-components"

export const Container = styled.div`
    
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: center;
    align-items: center;
    padding: 1rem;
    gap: 1rem;
    p {
        color: #f8f8f8;
        font-size: 1rem;
        margin: 0;
        text-align: center;
    }

    a {
        margin: 0;
        padding: 0;
        font-size: 1rem;
        color: #8be9fd;
        text-decoration: underline;
    }
`

export const Table = styled.table`
    border-collapse: separate;
    border-spacing: 0.15rem 1rem;
    width: 100%;

    tbody tr td {
        border-left: 8px solid transparent;
        border-radius: var(--border-radius-s);
    }

    th {
        background-color: #6272a4e1;
        height: 2.5rem;
        border-radius: var(--border-radius-m);
        border-radius: 20px 0px 20px 0px;
        font-size: 1.2rem;
    }

    thead tr th:first-child {
        border-radius: var(--border-radius-m) 0 0 var(--border-radius-m);
    }

    thead tr th:last-child {
        border-radius: 0 var(--border-radius-m) var(--border-radius-m) 0;
    }

    tbody > tr > td:last-child {
        border-radius: var(--border-radius-s);
    }

    td {
        height: 1rem;
        color: #6272a4;
        transition: 0.3s var(--hover-transition);
        cursor: pointer;
        padding: 0.35rem 0;
        word-break: break-word;
        font-size: 1.2rem;
    }

    tbody tr td:hover,
    tbody tr td[aria-current="true"] {
        background-color: #44475a39;
    }

    td.nothing {
        color: #44475a;
        opacity: 0;
        user-select: none;
    }

    td.nothing:hover {
        opacity: 0.5;
    }
`
