/*
 * Copyright (C) 2017 eschao <esc.chao@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *			 http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Drag & Drop class
 */
var DragDrop = (function() {
	'user strict';

	/**
	 * Constructor
	 */
	function DragDrop() {
		this.err_handler = null;
	}

	/**
	 * init drag & drop
	 *
	 * @param elements an array of all columns which could be dragged & dropped
	 */
	DragDrop.prototype.init = function(elements) {
		this.elements = elements;
		this.move_state = {
			index: -1, // which column element is selected when mouse down
			started: false, // the move is started?
			start_client_x: 0, // client x when move is starting
			start_left: 0, // the offset left of choosed element
			ele: null // moving element
		};

		let self = this;

		// mouse up event handler
		let onMouseUp = function() {
			let index = self.move_state.index;
			if (index > -1) {
				self.elements[index].style.color = null;
				self.move_state.index = -1;

				if (self.move_state.started) {
					self.elements[0].parentNode.removeChild(self.move_state.ele);
				}
				self.move_state.ele = null;
			}

			// response onClick event if need
			if (!self.move_state.started && this.onclick != null) {
				this.onclick.apply(this);
			}

			// restore default
			self.move_state.started = false;
			document.onmouseup = null;
			document.onmousemove = null;
		};

		// mouse move event handler
		let onMouseMove = function(event) {
			let index = self.move_state.index;
			let parent = self.elements[0].parentNode;

			// if moving is started
			if (self.move_state.started) {
				// compute offset left of moving element
				let l = self.move_state.start_left + event.clientX
								- self.move_state.start_client_x;
				if (l < parent.offsetLeft) {
					l = parent.offsetLeft;
				}

				// compute offset right of moving element
				let r = l + self.move_state.ele.offsetWidth;
				let parentRight = parent.offsetWidth + parent.offsetLeft;
				if (r > parentRight) {
					l = parentRight - self.move_state.ele.offsetWidth;
				}

				// set new offset left of moving element
				self.move_state.ele.style.left = l + 'px';

				// exchange the current selected element with its next element if
				// over half width of moving element is entering the next element
				if (index < self.elements.length - 1) {
					let next = self.elements[index + 1];
					if (next != self.move_state.ele &&
							r - next.offsetLeft > next.offsetWidth / 2) {
						parent.insertBefore(self.elements[index + 1],
																self.elements[index]);
						let t = self.elements[index];
						self.elements[index] = self.elements[index + 1];
						self.elements[index + 1] = t;
						self.move_state.index++;
						return;
					}
				}

				// exchange the current selected element with its pre element if
				// over half width of moving element is entering the pre element
				if (index > 0) {
					let pre = self.elements[index - 1];
					if (pre != self.move_state.ele &&
							l - pre.offsetLeft < pre.offsetWidth / 2) {
						parent.insertBefore(self.elements[index], self.elements[index -1]);
						let t = self.elements[index];
						self.elements[index] = self.elements[index - 1];
						self.elements[index - 1] = t;
						self.move_state.index--;
					}
				}
			}
			// moving is started only when movement on x axis is over 5 pixels
			else if (index > -1 &&
							 Math.abs(event.clientX - self.move_state.start_client_x) > 5) {
				parent.appendChild(self.move_state.ele);
				self.move_state.started = true;
				self.move_state.start_client_x = event.clientX;
				self.elements[index].style.color = 'transparent';
			}
		};

		// mouse down event handler
		let onMouseDown = function(event) {
			// find out which column is selected?
			let event_ele = this;
			for (let i = 0; i < elements.length; ++i) {
				if (elements[i] == event_ele) {
					self.move_state.index = i;
					break;
				}
			}

			if (self.move_state.index < 0) {
				console.warn("Can't find clicked element!");
				return;
			}

			// disable default event handler
			event.preventDefault();

			// clone move element from selected column element
			self.move_state.ele = this.cloneNode(true);

			// initial moving state
			self.move_state.ele.style.left = this.offsetLeft + 'px';
			self.move_state.ele.className += ' mg-dd-move-div';
			self.move_state.start_client_x = event.clientX;
			self.move_state.start_left = this.offsetLeft;
			self.move_state.ele.style.cursor = 'move';

			// set global mouse up/move event handlers
			document.onmouseup = onMouseUp;
			document.onmousemove = onMouseMove;
		};

		// set mouse down event handler for each column element
		this.elements.forEach(function(ele) {
			ele.onmousedown = onMouseDown;
		});
	};

	return DragDrop;
}());
