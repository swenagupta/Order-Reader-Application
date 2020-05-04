import React, { useEffect, useRef, useState } from 'react';
import './OrderReader.css';
import socketIOClient from "socket.io-client";
const ENDPOINT = "http://127.0.0.1:4000";
export function OrderReader() {
	const [orders, setOrders] = useState();
	const ordersToShow = useRef([]);
	const allOrders = useRef([]);
	const orderIdMap = useRef(new Map());
	const searchInputElement = useRef();
	const PAGE_SIZE = 20;
	const [pageNumber, setPageNumber] = useState(0);
	const totalPages = useRef(0);
	const handlePrev = () => {
		setPageNumber(pageNumber - 1);
		setShowOrders();
	};
	const handleNext = () => {
		setPageNumber(pageNumber + 1);
		setShowOrders();
	}
	const setShowOrders = () => {
		let searchValue = searchInputElement.current.value;
		let sortedAllOrders = allOrders.current.slice().sort((o1, o2) => o2.sent_at_second - o1.sent_at_second);
		let allOrdersToShow;
		if (searchValue === '')
			allOrdersToShow = sortedAllOrders;
		else
			allOrdersToShow = sortedAllOrders.filter(order => (order.price).toString().indexOf(searchValue) === 0);
		totalPages.current = Math.ceil(allOrdersToShow.length / PAGE_SIZE);
		let initialIndex = 0;
		for (let i = 0; i < allOrdersToShow.length; i += PAGE_SIZE) {
			ordersToShow.current[initialIndex] = allOrdersToShow.slice(i, i + PAGE_SIZE);
			initialIndex++;
		}
	};
	const debounce = (fn, delay) => {
		let timer = null;
		return () => {
			timer && clearTimeout(timer);
			timer = setTimeout(() => {
				fn.apply(this, arguments);
			}, delay);
		}
	};
	const renderEachOrder = order => {
		return (
			<tr key={order.id}>
				<td>{order.customer}</td>
				<td>{order.destination}</td>
				<td>{order.event_name}</td>
				<td>{order.id}</td>
				<td>{order.item}</td>
				<td>{order.price}</td>
			</tr>
		);
	};
	const renderEmptyState = () => {
		return (
			<tr>
				<td className="emptyState" colSpan="6">No results found.</td>
			</tr>
		);
	};
	useEffect(() => {
		searchInputElement.current = document.querySelector('.searchOrder');
    	const socket = socketIOClient(ENDPOINT);
    	socket.on('order_event', (data) => {
			setOrders(data);
			data.forEach(order => {
				if (orderIdMap.current.has(order.id)) {
					let loc = orderIdMap.current.get(order.id);
					allOrders.current[loc] = order;
				} else {
					allOrders.current.push(order);
					orderIdMap.current.set(order.id, allOrders.current.length - 1);
				}
			});
			setShowOrders();
		});
		searchInputElement.current.addEventListener('keydown', debounce(setShowOrders, 1000));
		return () => {
			searchInputElement.current.removeEventListener('keydown', debounce(setShowOrders, 1000));
		}
  	}, []);
	return (
		<div className="OrderReader">
			<div className="search">
		    	<input className="searchOrder" type="text" placeholder="Enter price to search orders"/>
			</div>
		    <table className="orderTable">
		    	<thead>
		    		<tr>
		    			<th>Customer Name</th>
		    			<th>Destination</th>
		    			<th>Status</th>
		    			<th>Order Id</th>
		    			<th>Item</th>
		    			<th>Price</th>
					</tr>
				</thead>
				<tbody>
					{ordersToShow.current.length > 0 && ordersToShow.current[pageNumber].map(renderEachOrder)}
					{ordersToShow.current.length === 0 && renderEmptyState()}
				</tbody>
			</table>
			{ordersToShow.current.length > 0 && (
					<div className="paginator">
					  	{pageNumber !== 0 && (<button className="prev" onClick={handlePrev}>Prev</button>)}
					  	{pageNumber + 1} of {totalPages.current}
					  	{pageNumber !== totalPages.current - 1 && (<button className="next" onClick={handleNext}>Next</button>)}
				  	</div>
			  	)
			}
		</div>
	);
}
