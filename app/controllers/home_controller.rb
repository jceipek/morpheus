class HomeController < ApplicationController
  def index
    @users = User.all
  end

  def show_data
  	if current_user
  		@data = current_user.sleep_data_block.sleeps
  	else
  		@data = nil
  	end
  end
end
